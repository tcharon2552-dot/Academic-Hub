import { OwnerType, PlanCode, WorkflowRunStatus, WorkflowType, type Prisma } from "@prisma/client";
import { db } from "../db";
import { callResearchModel, type NormalizedUsage, type ResearchModelInput } from "../new-api";
import { consumeQuota, getQuotaBalance, type QuotaClient, type QuotaType } from "../quota";

type SubscriptionResult = {
  id: string;
  ownerType: OwnerType;
  ownerId: string;
  planCode: PlanCode;
  status: string;
};

type WorkflowRunResult = {
  id: string;
  type: WorkflowType;
  status: WorkflowRunStatus;
  userId: string;
  teamId: string | null;
  documentId: string | null;
  inputSummary: string;
  outputSummary: string | null;
  metadata?: Prisma.JsonValue | Prisma.InputJsonValue | null;
};

type WorkflowRunCreateArgs = {
  data: {
    type: WorkflowType;
    status?: WorkflowRunStatus;
    userId: string;
    teamId?: string | null;
    documentId?: string | null;
    inputSummary: string;
    outputSummary?: string | null;
    metadata?: Prisma.InputJsonValue;
  };
};

type WorkflowRunUpdateArgs = {
  where: {
    id: string;
  };
  data: {
    status?: WorkflowRunStatus;
    outputSummary?: string | null;
    metadata?: Prisma.InputJsonValue;
  };
};

type UsageRecordCreateArgs = {
  data: {
    workflowRunId?: string | null;
    userId?: string | null;
    teamId?: string | null;
    ownerType: OwnerType;
    ownerId: string;
    ownerLabel?: string | null;
    provider: string;
    model: string;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    rawUsage?: Prisma.InputJsonValue;
  };
};

export type WorkflowClient = {
  subscription: {
    findUnique(args: {
      where: {
        ownerType_ownerId?: {
          ownerType: OwnerType;
          ownerId: string;
        };
      };
    }): Promise<SubscriptionResult | null>;
  };
  workflowRun: {
    create(args: WorkflowRunCreateArgs): Promise<WorkflowRunResult>;
    update(args: WorkflowRunUpdateArgs): Promise<WorkflowRunResult>;
  };
  usageRecord: {
    create(args: UsageRecordCreateArgs): Promise<unknown>;
  };
};

export type ResearchModelResult = {
  content: string;
  rawResponse: unknown;
  usage: NormalizedUsage;
};

export type ResearchModelCaller = (input: ResearchModelInput) => Promise<ResearchModelResult>;

export type WorkflowOptions = {
  client?: WorkflowClient;
  quotaClient?: QuotaClient;
  modelCaller?: ResearchModelCaller;
  model?: string;
};

export type WorkflowResult = {
  workflowRunId: string;
  output: string;
  usage: NormalizedUsage;
};

export class WorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkflowError";
  }
}

export const DEFAULT_RESEARCH_MODEL = "gpt-4o-mini";

export const prismaWorkflowClient: WorkflowClient = {
  subscription: {
    findUnique: (args) => db.subscription.findUnique(args as Prisma.SubscriptionFindUniqueArgs)
  },
  workflowRun: {
    create: (args) => db.workflowRun.create(args as Prisma.WorkflowRunCreateArgs),
    update: (args) => db.workflowRun.update(args as Prisma.WorkflowRunUpdateArgs)
  },
  usageRecord: {
    create: (args) => db.usageRecord.create(args as Prisma.UsageRecordCreateArgs)
  }
};

export function summarize(value: string, maxLength = 120) {
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length > maxLength ? `${compact.slice(0, maxLength - 1)}...` : compact;
}

export async function getPlanCodeForUser(client: WorkflowClient, userId: string) {
  const subscription = await client.subscription.findUnique({
    where: {
      ownerType_ownerId: {
        ownerType: OwnerType.USER,
        ownerId: userId
      }
    }
  });

  return subscription?.planCode ?? PlanCode.A0;
}

export async function runQuotaBackedWorkflow(input: {
  client: WorkflowClient;
  quotaClient?: QuotaClient;
  modelCaller?: ResearchModelCaller;
  userId: string;
  workflowType: WorkflowType;
  workflowName: string;
  quotaType: QuotaType;
  quotaAmount: number;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  inputSummary: string;
  documentId?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  const availableQuota = await getQuotaBalance(input.userId, input.quotaType, {
    client: input.quotaClient
  });

  if (availableQuota < input.quotaAmount) {
    throw new WorkflowError(
      `Insufficient quota for ${input.workflowName}. Required ${input.quotaAmount}, available ${availableQuota}.`
    );
  }

  const run = await input.client.workflowRun.create({
    data: {
      type: input.workflowType,
      status: WorkflowRunStatus.RUNNING,
      userId: input.userId,
      documentId: input.documentId ?? null,
      inputSummary: input.inputSummary,
      metadata: input.metadata
    }
  });

  try {
    const modelResult = await (input.modelCaller ?? callResearchModel)({
      workflowType: input.workflowName,
      model: input.model,
      systemPrompt: input.systemPrompt,
      userPrompt: input.userPrompt,
      metadata: {
        userId: input.userId,
        workflowRunId: run.id
      }
    });

    await input.client.usageRecord.create({
      data: {
        workflowRunId: run.id,
        userId: input.userId,
        ownerType: OwnerType.USER,
        ownerId: input.userId,
        provider: "new-api",
        model: input.model,
        promptTokens: modelResult.usage.promptTokens,
        completionTokens: modelResult.usage.completionTokens,
        totalTokens: modelResult.usage.totalTokens,
        rawUsage: modelResult.rawResponse as Prisma.InputJsonValue
      }
    });

    await consumeQuota(
      input.userId,
      input.quotaType,
      input.quotaAmount,
      {
        workflowRunId: run.id,
        workflowType: input.workflowType
      },
      {
        client: input.quotaClient
      }
    );

    const updatedRun = await input.client.workflowRun.update({
      where: {
        id: run.id
      },
      data: {
        status: WorkflowRunStatus.SUCCEEDED,
        outputSummary: summarize(modelResult.content)
      }
    });

    return {
      workflowRunId: updatedRun.id,
      output: modelResult.content,
      usage: modelResult.usage
    } satisfies WorkflowResult;
  } catch (error) {
    await input.client.workflowRun.update({
      where: {
        id: run.id
      },
      data: {
        status: WorkflowRunStatus.FAILED,
        outputSummary: error instanceof Error ? error.message : "Workflow failed."
      }
    });

    throw error;
  }
}

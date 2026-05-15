import { describe, expect, it, vi } from "vitest";
import { OwnerType, PlanCode, Prisma, SubscriptionStatus, WorkflowRunStatus, WorkflowType } from "@prisma/client";
import { consumeQuota, getQuotaBalance, grantAddOnQuota, QUOTA_TYPES, type QuotaClient } from "../../src/lib/quota";
import { registerUser, type AuthClient } from "../../src/lib/auth";
import { runLiteratureReviewWorkflow } from "../../src/lib/workflows/literature-review";
import { runPaperReaderWorkflow } from "../../src/lib/workflows/paper-reader";
import { runWritingPolishWorkflow } from "../../src/lib/workflows/writing-polish";
import { WorkflowError, type ResearchModelCaller, type WorkflowClient } from "../../src/lib/workflows/shared";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
};

type SubscriptionRow = {
  id: string;
  ownerType: OwnerType;
  ownerId: string;
  planCode: PlanCode;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date | null;
};

type LedgerRow = {
  ownerType: "USER" | "TEAM";
  ownerId: string;
  eventType:
    | "SIGNUP_GRANT"
    | "PLAN_GRANT"
    | "CONSUMPTION"
    | "ADD_ON_GRANT"
    | "ADJUSTMENT"
    | "EXPIRATION";
  quotaType: string;
  amount: number;
  balanceAfter: number | null;
  expiresAt?: Date | null;
  idempotencyKey?: string | null;
  metadata?: Prisma.InputJsonValue;
};

type LedgerWhereInput = {
  ownerType?: LedgerRow["ownerType"];
  ownerId?: string;
  quotaType?: string;
  expiresAt?: null | {
    gt?: Date;
  };
  OR?: LedgerWhereInput[];
};

type WorkflowRunRow = {
  id: string;
  type: WorkflowType;
  status: WorkflowRunStatus;
  userId: string;
  teamId: string | null;
  documentId: string | null;
  inputSummary: string;
  outputSummary: string | null;
  metadata?: Prisma.InputJsonValue;
};

type UsageRecordRow = {
  id: string;
  workflowRunId: string | null;
  userId: string | null;
  teamId: string | null;
  ownerType: OwnerType;
  ownerId: string;
  ownerLabel: string | null;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  rawUsage?: Prisma.InputJsonValue;
};

function matchesWhere(row: LedgerRow, where: LedgerWhereInput): boolean {
  if (where.OR && !where.OR.some((condition) => matchesWhere(row, condition))) {
    return false;
  }

  if (where.ownerType && row.ownerType !== where.ownerType) {
    return false;
  }

  if (where.ownerId && row.ownerId !== where.ownerId) {
    return false;
  }

  if (where.quotaType && row.quotaType !== where.quotaType) {
    return false;
  }

  if (where.expiresAt === null && row.expiresAt !== null && row.expiresAt !== undefined) {
    return false;
  }

  if (where.expiresAt && "gt" in where.expiresAt) {
    if (!row.expiresAt || !where.expiresAt.gt || row.expiresAt <= where.expiresAt.gt) {
      return false;
    }
  }

  return true;
}

function createAuthClient(rows: { users: UserRow[]; subscriptions: SubscriptionRow[] }): AuthClient {
  return {
    user: {
      upsert: async ({ where, update, create }) => {
        const existing = rows.users.find((user) => user.email === where.email);

        if (existing) {
          if ("name" in update) {
            existing.name = update.name as string | null;
          }

          return existing;
        }

        const user = {
          id: `user-${rows.users.length + 1}`,
          email: create.email,
          name: create.name ?? null
        };
        rows.users.push(user);
        return user;
      },
      findUnique: async ({ where }) => rows.users.find((user) => user.id === where.id) ?? null
    },
    subscription: {
      upsert: async ({ where, create }) => {
        const key = where.ownerType_ownerId;
        const existing = rows.subscriptions.find(
          (subscription) => subscription.ownerType === key?.ownerType && subscription.ownerId === key.ownerId
        );

        if (existing) {
          return existing;
        }

        const subscription = {
          id: `subscription-${rows.subscriptions.length + 1}`,
          ownerType: create.ownerType,
          ownerId: create.ownerId,
          planCode: create.planCode,
          status: create.status ?? SubscriptionStatus.ACTIVE,
          currentPeriodStart: create.currentPeriodStart as Date,
          currentPeriodEnd: create.currentPeriodEnd ?? null
        } satisfies SubscriptionRow;
        rows.subscriptions.push(subscription);
        return subscription;
      },
      findUnique: async ({ where }) => {
        const key = where.ownerType_ownerId;
        return (
          rows.subscriptions.find(
            (subscription) => subscription.ownerType === key?.ownerType && subscription.ownerId === key.ownerId
          ) ?? null
        );
      }
    }
  };
}

function createQuotaClient(rows: LedgerRow[] = []): QuotaClient & { rows: LedgerRow[] } {
  const client: QuotaClient & { rows: LedgerRow[] } = {
    rows,
    quotaLedger: {
      aggregate: async ({ where }) => ({
        _sum: {
          amount: rows
            .filter((row) => matchesWhere(row, where as LedgerWhereInput))
            .reduce((sum, row) => sum + row.amount, 0)
        }
      }),
      create: async ({ data }) => {
        rows.push({
          ownerType: data.ownerType,
          ownerId: data.ownerId,
          eventType: data.eventType,
          quotaType: data.quotaType,
          amount: data.amount,
          balanceAfter: data.balanceAfter ?? null,
          expiresAt: data.expiresAt ?? null,
          idempotencyKey: data.idempotencyKey ?? null,
          metadata: data.metadata
        });
      },
      createMany: async ({ data, skipDuplicates }) => {
        let count = 0;

        for (const entry of data) {
          if (entry.idempotencyKey && rows.some((row) => row.idempotencyKey === entry.idempotencyKey)) {
            if (skipDuplicates) {
              continue;
            }

            throw Object.assign(new Error("P2002"), { code: "P2002" });
          }

          rows.push({
            ownerType: entry.ownerType,
            ownerId: entry.ownerId,
            eventType: entry.eventType,
            quotaType: entry.quotaType,
            amount: entry.amount,
            balanceAfter: entry.balanceAfter ?? null,
            expiresAt: entry.expiresAt ?? null,
            idempotencyKey: entry.idempotencyKey ?? null,
            metadata: entry.metadata
          });
          count += 1;
        }

        return { count };
      }
    },
    $transaction: async (callback) => callback(client)
  };

  return client;
}

function createWorkflowClient(rows: {
  subscriptions: SubscriptionRow[];
  workflowRuns: WorkflowRunRow[];
  usageRecords: UsageRecordRow[];
}): WorkflowClient {
  return {
    subscription: {
      findUnique: async ({ where }) => {
        const key = where.ownerType_ownerId;
        return (
          rows.subscriptions.find(
            (subscription) => subscription.ownerType === key?.ownerType && subscription.ownerId === key.ownerId
          ) ?? null
        );
      }
    },
    workflowRun: {
      create: async ({ data }) => {
        const run = {
          id: `workflow-run-${rows.workflowRuns.length + 1}`,
          type: data.type,
          status: data.status ?? WorkflowRunStatus.PENDING,
          userId: data.userId,
          teamId: data.teamId ?? null,
          documentId: data.documentId ?? null,
          inputSummary: data.inputSummary,
          outputSummary: data.outputSummary ?? null,
          metadata: data.metadata
        } satisfies WorkflowRunRow;
        rows.workflowRuns.push(run);
        return run;
      },
      update: async ({ where, data }) => {
        const run = rows.workflowRuns.find((item) => item.id === where.id);

        if (!run) {
          throw new Error(`Workflow run not found: ${where.id}`);
        }

        if (data.status) {
          run.status = data.status;
        }

        if ("outputSummary" in data) {
          run.outputSummary = data.outputSummary ?? null;
        }

        if ("metadata" in data) {
          run.metadata = data.metadata;
        }

        return run;
      }
    },
    usageRecord: {
      create: async ({ data }) => {
        const usage = {
          id: `usage-record-${rows.usageRecords.length + 1}`,
          workflowRunId: data.workflowRunId ?? null,
          userId: data.userId ?? null,
          teamId: data.teamId ?? null,
          ownerType: data.ownerType,
          ownerId: data.ownerId,
          ownerLabel: data.ownerLabel ?? null,
          provider: data.provider,
          model: data.model,
          promptTokens: data.promptTokens ?? 0,
          completionTokens: data.completionTokens ?? 0,
          totalTokens: data.totalTokens ?? 0,
          rawUsage: data.rawUsage
        } satisfies UsageRecordRow;
        rows.usageRecords.push(usage);
        return usage;
      }
    }
  };
}

function createModelCaller(content = "Workflow output"): ResearchModelCaller {
  return vi.fn(async () => ({
    content,
    rawResponse: {
      id: "chatcmpl-test"
    },
    usage: {
      promptTokens: 40,
      completionTokens: 20,
      totalTokens: 60
    }
  }));
}

describe("registration workflow", () => {
  it("creates a user, A0 subscription, and signup quota grant", async () => {
    const authRows = {
      users: [] as UserRow[],
      subscriptions: [] as SubscriptionRow[]
    };
    const authClient = createAuthClient(authRows);
    const quotaClient = createQuotaClient();

    const result = await registerUser(
      {
        email: " Researcher@Example.COM ",
        name: "Dr. Lin"
      },
      {
        client: authClient,
        quotaClient,
        now: () => new Date("2026-05-15T00:00:00.000Z")
      }
    );

    expect(result.user).toMatchObject({
      id: "user-1",
      email: "researcher@example.com",
      name: "Dr. Lin"
    });
    expect(authRows.users).toHaveLength(1);
    expect(authRows.subscriptions).toEqual([
      expect.objectContaining({
        ownerType: "USER",
        ownerId: "user-1",
        planCode: "A0",
        status: "ACTIVE",
        currentPeriodStart: new Date("2026-05-15T00:00:00.000Z")
      })
    ]);
    expect(quotaClient.rows.filter((row) => row.eventType === "SIGNUP_GRANT")).toHaveLength(3);
    await expect(getQuotaBalance(result.user.id, QUOTA_TYPES.researchTask, { client: quotaClient })).resolves.toBe(
      30
    );
    await expect(getQuotaBalance(result.user.id, QUOTA_TYPES.paperReading, { client: quotaClient })).resolves.toBe(5);
    await expect(getQuotaBalance(result.user.id, QUOTA_TYPES.advancedModel, { client: quotaClient })).resolves.toBe(
      2
    );
  });

  it("keeps repeated registration idempotent for free credits", async () => {
    const authRows = {
      users: [] as UserRow[],
      subscriptions: [] as SubscriptionRow[]
    };
    const authClient = createAuthClient(authRows);
    const quotaClient = createQuotaClient();

    await registerUser({ email: "researcher@example.com" }, { client: authClient, quotaClient });
    await registerUser({ email: "researcher@example.com" }, { client: authClient, quotaClient });

    expect(authRows.users).toHaveLength(1);
    expect(authRows.subscriptions).toHaveLength(1);
    expect(quotaClient.rows.filter((row) => row.eventType === "SIGNUP_GRANT")).toHaveLength(3);
    await expect(getQuotaBalance("user-1", QUOTA_TYPES.researchTask, { client: quotaClient })).resolves.toBe(30);
  });
});

describe("research workflows", () => {
  it("paper reader consumes paper reading quota", async () => {
    const authRows = {
      users: [] as UserRow[],
      subscriptions: [] as SubscriptionRow[]
    };
    const authClient = createAuthClient(authRows);
    const quotaClient = createQuotaClient();
    const workflowRows = {
      subscriptions: authRows.subscriptions,
      workflowRuns: [] as WorkflowRunRow[],
      usageRecords: [] as UsageRecordRow[]
    };
    const workflowClient = createWorkflowClient(workflowRows);
    const modelCaller = createModelCaller("Paper summary");
    const { user } = await registerUser({ email: "paper@example.com" }, { client: authClient, quotaClient });

    const result = await runPaperReaderWorkflow(
      {
        userId: user.id,
        title: "Attention Is All You Need",
        text: "This paper introduces a transformer architecture for sequence transduction research."
      },
      {
        client: workflowClient,
        quotaClient,
        modelCaller
      }
    );

    expect(result.output).toBe("Paper summary");
    await expect(getQuotaBalance(user.id, QUOTA_TYPES.paperReading, { client: quotaClient })).resolves.toBe(4);
    expect(quotaClient.rows.at(-1)).toMatchObject({
      eventType: "CONSUMPTION",
      quotaType: QUOTA_TYPES.paperReading,
      amount: -1,
      metadata: {
        workflowRunId: "workflow-run-1",
        workflowType: "PAPER_READER"
      }
    });
  });

  it("writing polish consumes research task quota", async () => {
    const authRows = {
      users: [] as UserRow[],
      subscriptions: [] as SubscriptionRow[]
    };
    const authClient = createAuthClient(authRows);
    const quotaClient = createQuotaClient();
    const workflowClient = createWorkflowClient({
      subscriptions: authRows.subscriptions,
      workflowRuns: [],
      usageRecords: []
    });
    const { user } = await registerUser({ email: "writing@example.com" }, { client: authClient, quotaClient });

    await runWritingPolishWorkflow(
      {
        userId: user.id,
        text: "This method is good and the result is useful for many tasks.",
        goal: "Make the paragraph more suitable for a journal submission."
      },
      {
        client: workflowClient,
        quotaClient,
        modelCaller: createModelCaller("Polished paragraph")
      }
    );

    await expect(getQuotaBalance(user.id, QUOTA_TYPES.researchTask, { client: quotaClient })).resolves.toBe(29);
  });

  it("literature review rejects A0 and A1 users when batch quota is unavailable", async () => {
    const authRows = {
      users: [] as UserRow[],
      subscriptions: [] as SubscriptionRow[]
    };
    const authClient = createAuthClient(authRows);
    const quotaClient = createQuotaClient();
    const workflowRows = {
      subscriptions: authRows.subscriptions,
      workflowRuns: [] as WorkflowRunRow[],
      usageRecords: [] as UsageRecordRow[]
    };
    const workflowClient = createWorkflowClient(workflowRows);
    const { user } = await registerUser({ email: "lit@example.com" }, { client: authClient, quotaClient });
    authRows.subscriptions[0].planCode = PlanCode.A1;
    await grantAddOnQuota(user.id, QUOTA_TYPES.longDocument, 3, null, { client: quotaClient });

    await expect(
      runLiteratureReviewWorkflow(
        {
          userId: user.id,
          papers: [
            {
              title: "Paper A",
              abstract: "Paper A studies retrieval augmented generation for scientific literature review."
            },
            {
              title: "Paper B",
              abstract: "Paper B evaluates model-assisted synthesis for research teams."
            }
          ],
          question: "Compare their methods."
        },
        {
          client: workflowClient,
          quotaClient,
          modelCaller: createModelCaller("Literature synthesis")
        }
      )
    ).rejects.toBeInstanceOf(WorkflowError);
    expect(workflowRows.workflowRuns).toHaveLength(0);
    expect(workflowRows.usageRecords).toHaveLength(0);
    await expect(getQuotaBalance(user.id, QUOTA_TYPES.longDocument, { client: quotaClient })).resolves.toBe(3);
  });

  it("records workflow run status, summary, output, and usage", async () => {
    const authRows = {
      users: [] as UserRow[],
      subscriptions: [] as SubscriptionRow[]
    };
    const authClient = createAuthClient(authRows);
    const quotaClient = createQuotaClient();
    const workflowRows = {
      subscriptions: authRows.subscriptions,
      workflowRuns: [] as WorkflowRunRow[],
      usageRecords: [] as UsageRecordRow[]
    };
    const workflowClient = createWorkflowClient(workflowRows);
    const { user } = await registerUser({ email: "records@example.com" }, { client: authClient, quotaClient });

    await runWritingPolishWorkflow(
      {
        userId: user.id,
        text: "Our results shows that the proposed model can improve baseline performance.",
        goal: "Keep the claim precise."
      },
      {
        client: workflowClient,
        quotaClient,
        modelCaller: createModelCaller("Our results show that the proposed model improves baseline performance.")
      }
    );

    expect(workflowRows.workflowRuns).toEqual([
      expect.objectContaining({
        id: "workflow-run-1",
        type: WorkflowType.WRITING_POLISH,
        status: WorkflowRunStatus.SUCCEEDED,
        inputSummary: "Writing polish: Our results shows that the proposed model can improve baseline performance.",
        outputSummary: "Our results show that the proposed model improves baseline performance."
      })
    ]);
    expect(workflowRows.usageRecords).toEqual([
      expect.objectContaining({
        workflowRunId: "workflow-run-1",
        userId: user.id,
        ownerType: OwnerType.USER,
        ownerId: user.id,
        provider: "new-api",
        model: "gpt-4o-mini",
        promptTokens: 40,
        completionTokens: 20,
        totalTokens: 60
      })
    ]);
  });

  it("checks quota before calling the model", async () => {
    const authRows = {
      users: [] as UserRow[],
      subscriptions: [] as SubscriptionRow[]
    };
    const authClient = createAuthClient(authRows);
    const quotaClient = createQuotaClient();
    const workflowRows = {
      subscriptions: authRows.subscriptions,
      workflowRuns: [] as WorkflowRunRow[],
      usageRecords: [] as UsageRecordRow[]
    };
    const workflowClient = createWorkflowClient(workflowRows);
    const modelCaller = createModelCaller("Should not run");
    const { user } = await registerUser({ email: "insufficient@example.com" }, { client: authClient, quotaClient });
    await consumeQuota(user.id, QUOTA_TYPES.researchTask, 30, undefined, { client: quotaClient });

    await expect(
      runWritingPolishWorkflow(
        {
          userId: user.id,
          text: "This paragraph needs polishing but no research task credits remain.",
          goal: "Improve clarity."
        },
        {
          client: workflowClient,
          quotaClient,
          modelCaller
        }
      )
    ).rejects.toBeInstanceOf(WorkflowError);

    expect(modelCaller).not.toHaveBeenCalled();
    expect(workflowRows.workflowRuns).toHaveLength(0);
    expect(workflowRows.usageRecords).toHaveLength(0);
  });
});

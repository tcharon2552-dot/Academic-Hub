import { PlanCode, WorkflowType } from "@prisma/client";
import { QUOTA_TYPES } from "../quota";
import { literatureReviewInputSchema, type LiteratureReviewInput } from "../validators/workflows";
import {
  DEFAULT_RESEARCH_MODEL,
  WorkflowError,
  getDefaultWorkflowClient,
  getPlanCodeForUser,
  runQuotaBackedWorkflow,
  summarize,
  type WorkflowOptions
} from "./shared";

const disallowedPlans = new Set<PlanCode>([PlanCode.A0, PlanCode.A1]);

export async function runLiteratureReviewWorkflow(input: LiteratureReviewInput, options: WorkflowOptions = {}) {
  const parsed = literatureReviewInputSchema.parse(input);
  const client = options.client ?? getDefaultWorkflowClient();
  const planCode = await getPlanCodeForUser(client, parsed.userId);

  if (disallowedPlans.has(planCode)) {
    throw new WorkflowError("Literature review requires A2 or higher because it uses batch long-document quota.");
  }

  const model = options.model ?? DEFAULT_RESEARCH_MODEL;
  const paperList = parsed.papers
    .map((paper, index) => `${index + 1}. ${paper.title}\nAbstract: ${paper.abstract}`)
    .join("\n\n");

  return runQuotaBackedWorkflow({
    client,
    quotaClient: options.quotaClient,
    modelCaller: options.modelCaller,
    userId: parsed.userId,
    workflowType: WorkflowType.LITERATURE_REVIEW,
    workflowName: "literature_review",
    quotaType: QUOTA_TYPES.longDocument,
    quotaAmount: parsed.papers.length,
    model,
    systemPrompt:
      "You are a literature review assistant. Compare papers by research question, method, evidence, limitations, and synthesis opportunities.",
    userPrompt: `Research question: ${parsed.question}\n\nPapers:\n${paperList}`,
    inputSummary: `Literature review: ${summarize(parsed.question)}`,
    metadata: {
      paperCount: parsed.papers.length,
      question: parsed.question
    }
  });
}

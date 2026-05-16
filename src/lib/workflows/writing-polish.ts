import { WorkflowType } from "@prisma/client";
import { QUOTA_TYPES } from "../quota";
import { writingPolishInputSchema, type WritingPolishInput } from "../validators/workflows";
import {
  DEFAULT_RESEARCH_MODEL,
  getDefaultWorkflowClient,
  runQuotaBackedWorkflow,
  summarize,
  type WorkflowOptions
} from "./shared";

export async function runWritingPolishWorkflow(input: WritingPolishInput, options: WorkflowOptions = {}) {
  const parsed = writingPolishInputSchema.parse(input);
  const model = options.model ?? DEFAULT_RESEARCH_MODEL;
  const goal = parsed.goal ? `\nUser goal: ${parsed.goal}` : "";

  return runQuotaBackedWorkflow({
    client: options.client ?? getDefaultWorkflowClient(),
    quotaClient: options.quotaClient,
    modelCaller: options.modelCaller,
    userId: parsed.userId,
    workflowType: WorkflowType.WRITING_POLISH,
    workflowName: "writing_polish",
    quotaType: QUOTA_TYPES.researchTask,
    quotaAmount: 1,
    model,
    systemPrompt:
      "You are an academic writing editor. Improve clarity, grammar, and scholarly tone without changing the research claim or adding unsupported claims.",
    userPrompt: `Polish this academic text.${goal}\n\nText:\n${parsed.text}`,
    inputSummary: `Writing polish: ${summarize(parsed.text)}`,
    metadata: {
      goal: parsed.goal ?? null
    }
  });
}

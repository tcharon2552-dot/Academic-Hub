import { WorkflowType } from "@prisma/client";
import { QUOTA_TYPES } from "../quota";
import { paperReaderInputSchema, type PaperReaderInput } from "../validators/workflows";
import {
  DEFAULT_RESEARCH_MODEL,
  getDefaultWorkflowClient,
  runQuotaBackedWorkflow,
  summarize,
  type WorkflowOptions
} from "./shared";

export async function runPaperReaderWorkflow(input: PaperReaderInput, options: WorkflowOptions = {}) {
  const parsed = paperReaderInputSchema.parse(input);
  const model = options.model ?? DEFAULT_RESEARCH_MODEL;

  return runQuotaBackedWorkflow({
    client: options.client ?? getDefaultWorkflowClient(),
    quotaClient: options.quotaClient,
    modelCaller: options.modelCaller,
    userId: parsed.userId,
    workflowType: WorkflowType.PAPER_READER,
    workflowName: "paper_reader",
    quotaType: QUOTA_TYPES.paperReading,
    quotaAmount: 1,
    model,
    systemPrompt:
      "You are an academic paper reading assistant. Produce structured, cautious notes with claims, methods, evidence, limitations, and follow-up questions.",
    userPrompt: `Paper title: ${parsed.title}\n\nPaper text:\n${parsed.text}`,
    inputSummary: `Paper reader: ${summarize(parsed.title)}`,
    documentId: parsed.documentId ?? null,
    metadata: {
      title: parsed.title
    }
  });
}

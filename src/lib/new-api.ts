import type { AppEnv } from "./env";
import { getEnv } from "./env";

export type ResearchModelInput = {
  workflowType: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type NormalizedUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  usage?: {
    prompt_tokens?: number | null;
    completion_tokens?: number | null;
    total_tokens?: number | null;
  };
};

type NewApiErrorBody = {
  error?: {
    message?: string;
  };
  message?: string;
};

type CallResearchModelOptions = {
  env?: AppEnv;
  fetch?: typeof fetch;
};

export class NewApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "NewApiError";
    this.status = status;
  }
}

export function normalizeUsage(response: ChatCompletionResponse): NormalizedUsage {
  const promptTokens = response.usage?.prompt_tokens ?? 0;
  const completionTokens = response.usage?.completion_tokens ?? 0;

  return {
    promptTokens,
    completionTokens,
    totalTokens: response.usage?.total_tokens ?? promptTokens + completionTokens
  };
}

function getResponseContent(response: ChatCompletionResponse) {
  const content = response.choices?.[0]?.message?.content;

  if (!content) {
    throw new NewApiError("New API response did not include assistant content.");
  }

  return content;
}

async function parseErrorMessage(response: Response) {
  const body = (await response.json().catch(() => null)) as NewApiErrorBody | null;
  return body?.error?.message ?? body?.message ?? response.statusText;
}

export async function callResearchModel(input: ResearchModelInput, options: CallResearchModelOptions = {}) {
  const env = options.env ?? getEnv();
  const fetchImpl = options.fetch ?? fetch;
  const response = await fetchImpl(`${env.NEW_API_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.NEW_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: input.model,
      messages: [
        {
          role: "system",
          content: input.systemPrompt
        },
        {
          role: "user",
          content: input.userPrompt
        }
      ],
      metadata: {
        workflowType: input.workflowType,
        ...(input.metadata ?? {})
      }
    })
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new NewApiError(`New API request failed with status ${response.status}: ${message}`, response.status);
  }

  const rawResponse = (await response.json()) as ChatCompletionResponse;

  return {
    content: getResponseContent(rawResponse),
    rawResponse,
    usage: normalizeUsage(rawResponse)
  };
}

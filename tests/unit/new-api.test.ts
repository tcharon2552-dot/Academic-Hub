import { afterEach, describe, expect, it, vi } from "vitest";
import { getEnv } from "../../src/lib/env";
import { callResearchModel, NewApiError, normalizeUsage } from "../../src/lib/new-api";

const validEnv = {
  DATABASE_URL: "postgresql://academic_hub:academic_hub@localhost:5432/academic_hub",
  NEW_API_BASE_URL: "https://new-api.example.com",
  NEW_API_KEY: "test-key",
  APP_BASE_URL: "http://localhost:3000"
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("environment validation", () => {
  it("fails fast when required env vars are missing", () => {
    expect(() => getEnv({})).toThrow("Missing or invalid environment variables");
  });

  it("returns normalized environment values", () => {
    expect(
      getEnv({
        ...validEnv,
        NEW_API_BASE_URL: "https://new-api.example.com/"
      })
    ).toEqual({
      ...validEnv,
      NEW_API_BASE_URL: "https://new-api.example.com"
    });
  });
});

describe("new api client", () => {
  it("normalizes usage from OpenAI-compatible responses", () => {
    expect(
      normalizeUsage({
        usage: {
          prompt_tokens: 100,
          completion_tokens: 25,
          total_tokens: 125
        }
      })
    ).toEqual({
      promptTokens: 100,
      completionTokens: 25,
      totalTokens: 125
    });
  });

  it("maps workflow metadata into chat completion requests", async () => {
    const fetchMock = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
      Response.json({
        id: "chatcmpl-test",
        choices: [
          {
            message: {
              content: "Structured summary"
            }
          }
        ],
        usage: {
          prompt_tokens: 30,
          completion_tokens: 12,
          total_tokens: 42
        }
      })
    );

    const result = await callResearchModel(
      {
        workflowType: "paper_reader",
        model: "gpt-4o-mini",
        systemPrompt: "You help researchers read papers.",
        userPrompt: "Summarize this paper.",
        metadata: {
          userId: "user-1",
          documentId: "doc-1"
        }
      },
      {
        env: validEnv,
        fetch: fetchMock
      }
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://new-api.example.com/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key",
          "Content-Type": "application/json"
        }),
        body: expect.any(String)
      })
    );
    const requestInit = fetchMock.mock.calls[0]?.[1];
    expect(requestInit).toBeDefined();
    expect(JSON.parse(requestInit?.body as string)).toEqual({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You help researchers read papers."
        },
        {
          role: "user",
          content: "Summarize this paper."
        }
      ],
      metadata: {
        workflowType: "paper_reader",
        userId: "user-1",
        documentId: "doc-1"
      }
    });
    expect(result).toEqual({
      content: "Structured summary",
      rawResponse: expect.any(Object),
      usage: {
        promptTokens: 30,
        completionTokens: 12,
        totalTokens: 42
      }
    });
  });

  it("raises actionable errors for HTTP failures", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json(
        {
          error: {
            message: "quota exceeded"
          }
        },
        {
          status: 429
        }
      )
    );

    await expect(
      callResearchModel(
        {
          workflowType: "writing_polish",
          model: "gpt-4o-mini",
          systemPrompt: "Polish academic writing.",
          userPrompt: "Improve this paragraph."
        },
        {
          env: validEnv,
          fetch: fetchMock
        }
      )
    ).rejects.toMatchObject({
      name: "NewApiError",
      status: 429,
      message: "New API request failed with status 429: quota exceeded"
    } satisfies Partial<NewApiError>);
  });
});

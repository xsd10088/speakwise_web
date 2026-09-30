import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./storage", () => ({
  storagePut: vi.fn(),
  storageGetSignedUrl: vi.fn(),
}));

vi.mock("./_core/voiceTranscription", () => ({
  transcribeAudio: vi.fn(),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import { appRouter } from "./routers";
import { storageGetSignedUrl, storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("voice.evaluate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects unsupported formats before uploading", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(
      caller.voice.evaluate({
        audioBase64: Buffer.alloc(24, 1).toString("base64"),
        mimeType: "audio/flac",
        targetSentence: "Hello, nice to meet you.",
        language: "en",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(storagePut).not.toHaveBeenCalled();
  });

  it("transcribes the take and returns structured AI feedback", async () => {
    vi.mocked(storagePut).mockResolvedValue({
      key: "speakwise/evaluations/take.webm",
      url: "/manus-storage/speakwise/evaluations/take.webm",
    });
    vi.mocked(storageGetSignedUrl).mockResolvedValue("https://signed.example/evaluation.webm");
    vi.mocked(transcribeAudio).mockResolvedValue({
      task: "transcribe",
      language: "en",
      duration: 2.1,
      text: "Hello, nice to meet you.",
      segments: [],
    });
    vi.mocked(invokeLLM).mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({
        overallScore: 91,
        pronunciationScore: 90,
        fluencyScore: 92,
        accuracyScore: 91,
        summary: "表达清晰自然。",
        issues: ["句尾语调还可以更自然。"],
        suggestions: ["继续保持句尾的自然降调。"],
      }) } }],
    } as never);

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.voice.evaluate({
      audioBase64: Buffer.alloc(24, 1).toString("base64"),
      mimeType: "audio/webm;codecs=opus",
      targetSentence: "Hello, nice to meet you.",
      language: "en",
    });

    expect(result).toEqual({
      transcript: "Hello, nice to meet you.",
      duration: 2.1,
      overallScore: 91,
      pronunciationScore: 90,
      fluencyScore: 92,
      accuracyScore: 91,
      summary: "表达清晰自然。",
      issues: ["句尾语调还可以更自然。"],
      suggestions: ["继续保持句尾的自然降调。"],
    });
    expect(invokeLLM).toHaveBeenCalledOnce();
    expect(invokeLLM).toHaveBeenCalledWith(expect.objectContaining({
      model: "gpt-5-mini",
      response_format: expect.objectContaining({ type: "json_schema" }),
    }));
  });
});

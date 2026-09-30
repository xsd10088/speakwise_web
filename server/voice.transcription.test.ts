import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./storage", () => ({
  storagePut: vi.fn(),
  storageGetSignedUrl: vi.fn(),
}));

vi.mock("./_core/voiceTranscription", () => ({
  transcribeAudio: vi.fn(),
}));

import { appRouter } from "./routers";
import { storageGetSignedUrl, storagePut } from "./storage";
import { transcribeAudio } from "./_core/voiceTranscription";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("voice.transcribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unsupported audio formats before uploading", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(
      caller.voice.transcribe({
        audioBase64: "data:audio/flac;base64,AAAAAA",
        mimeType: "audio/flac",
        language: "en",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(storagePut).not.toHaveBeenCalled();
  });

  it("rejects missing audio payloads at the input boundary", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(
      caller.voice.transcribe({
        audioBase64: "short",
        mimeType: "audio/webm",
        language: "en",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("uploads the audio and returns a normalized transcription", async () => {
    vi.mocked(storagePut).mockResolvedValue({
      key: "speakwise/transcriptions/take.webm",
      url: "/manus-storage/speakwise/transcriptions/take.webm",
    });
    vi.mocked(storageGetSignedUrl).mockResolvedValue("https://signed.example/take.webm");
    vi.mocked(transcribeAudio).mockResolvedValue({
      task: "transcribe",
      language: "en",
      duration: 2.4,
      text: "I am looking forward to learning something new today.",
      segments: [],
    });

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.voice.transcribe({
      audioBase64: Buffer.alloc(24, 1).toString("base64"),
      mimeType: "audio/webm;codecs=opus",
      language: "en",
    });

    expect(result).toMatchObject({
      text: "I am looking forward to learning something new today.",
      language: "en",
      duration: 2.4,
    });
    expect(storagePut).toHaveBeenCalledOnce();
    expect(storageGetSignedUrl).toHaveBeenCalledWith("speakwise/transcriptions/take.webm");
    expect(transcribeAudio).toHaveBeenCalledWith(expect.objectContaining({
      audioUrl: "https://signed.example/take.webm",
      language: "en",
    }));
  });
});

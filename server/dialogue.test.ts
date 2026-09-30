import { describe, expect, it } from "vitest";

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: undefined,
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("dialogue.suggestions", () => {
  it("rejects an empty AI message before calling the AI model", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(caller.dialogue.suggestions({
      level: "beginner",
      scene: "greetings",
      history: [],
      aiMessage: "   ",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects an oversized AI message", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(caller.dialogue.suggestions({
      level: "intermediate",
      scene: "travel",
      history: [],
      aiMessage: "a".repeat(601),
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects an unsupported scene", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(caller.dialogue.suggestions({
      level: "advanced",
      // @ts-expect-error Intentionally invalid input for runtime schema coverage.
      scene: "unknown",
      history: [],
      aiMessage: "What would you recommend?",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("dialogue.reply", () => {
  it("rejects an empty learner response before calling the AI model", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(caller.dialogue.reply({
      level: "beginner",
      scene: "greetings",
      history: [],
      userMessage: "   ",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects an oversized learner response", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(caller.dialogue.reply({
      level: "intermediate",
      scene: "business",
      history: [],
      userMessage: "a".repeat(601),
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects an unsupported scene before calling the AI model", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(caller.dialogue.reply({
      level: "advanced",
      // @ts-expect-error Intentionally invalid input for runtime schema coverage.
      scene: "unknown",
      history: [],
      userMessage: "I would like to continue the conversation.",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

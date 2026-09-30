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

describe("translation.toEnglish", () => {
  it("rejects empty Chinese source text before calling the translation model", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(caller.translation.toEnglish({ text: "   " })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("rejects oversized Chinese source text", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(caller.translation.toEnglish({ text: "中".repeat(601) })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });
});

describe("translation.toChinese", () => {
  it("rejects empty source text before calling the translation model", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(caller.translation.toChinese({ text: "   " })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("rejects oversized source text", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(caller.translation.toChinese({ text: "a".repeat(601) })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });
});

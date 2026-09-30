import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { invokeLLM } from "../_core/llm";
import { publicProcedure, router } from "../_core/trpc";

const englishTranslationSchema = z.object({
  translation: z.string().trim().min(1).max(600),
});

export const translationRouter = router({
  toEnglish: publicProcedure
    .input(z.object({ text: z.string().trim().min(1).max(600) }))
    .mutation(async ({ input }) => {
      try {
        const response = await invokeLLM({
          model: "gpt-5-mini",
          messages: [
            {
              role: "system",
              content: "You are a natural English speaking coach for Chinese learners. Translate the user's Simplified Chinese into one concise, natural English sentence or short spoken response suitable for the current conversation. Preserve intent, tone, names, and politeness. Return only the requested JSON. Do not add explanations or answer the conversation.",
            },
            {
              role: "user",
              content: `Convert this Chinese learner response into natural spoken English:\n${input.text}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "chinese_to_english_speaking_translation",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  translation: { type: "string", description: "A natural spoken English translation." },
                },
                required: ["translation"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        if (typeof content !== "string") throw new Error("English translation response was not text");
        const parsed = englishTranslationSchema.safeParse(JSON.parse(content));
        if (!parsed.success) throw new Error("English translation response was empty");
        return parsed.data;
      } catch (error) {
        console.error("[Translation] Chinese-to-English failed", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "英文表达生成暂时不可用，请稍后重试。",
        });
      }
    }),
  toChinese: publicProcedure
    .input(z.object({ text: z.string().trim().min(1).max(600) }))
    .mutation(async ({ input }) => {
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are a precise English-to-Simplified-Chinese translator for an English speaking practice app. Return only the requested JSON. Preserve the meaning, tone, names, and punctuation. Do not add explanations.",
            },
            {
              role: "user",
              content: `Translate this English dialogue sentence into natural Simplified Chinese:\n${input.text}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "english_sentence_translation",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  translation: { type: "string", description: "The natural Simplified Chinese translation." },
                },
                required: ["translation"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        if (typeof content !== "string") {
          throw new Error("Translation response was not text");
        }

        const parsed = JSON.parse(content) as { translation?: unknown };
        if (typeof parsed.translation !== "string" || parsed.translation.trim().length === 0) {
          throw new Error("Translation response was empty");
        }

        return { translation: parsed.translation.trim() };
      } catch (error) {
        console.error("[Translation] Failed", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "翻译服务暂时不可用，请稍后重试。",
        });
      }
    }),
});

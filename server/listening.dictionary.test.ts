import fs from "node:fs";
import { describe, expect, it } from "vitest";

const listeningSource = fs.readFileSync(
  new URL("../client/src/components/ListeningTrainingView.tsx", import.meta.url),
  "utf8",
);
const dictionarySource = fs.readFileSync(
  new URL("../client/src/components/InteractiveSentence.tsx", import.meta.url),
  "utf8",
);

const dictionaryKeys = new Set(
  [...dictionarySource.matchAll(/^\s{2}([a-z0-9]+):\s*\{\s*phonetic:/gim)].map((match) => match[1].toLowerCase()),
);
const suffixes = ["ies", "es", "s", "ed", "ing", "ly", "er", "est"];

function resolvesToDictionary(word: string) {
  if (dictionaryKeys.has(word)) return true;
  for (const suffix of suffixes) {
    if (!word.endsWith(suffix) || word.length - suffix.length < 2) continue;
    const base = word.slice(0, word.length - suffix.length);
    if (dictionaryKeys.has(base)) return true;
    if (base.length > 1 && base.at(-1) === base.at(-2) && dictionaryKeys.has(base.slice(0, -1))) {
      return true;
    }
  }
  return false;
}

describe("listening training dictionary coverage", () => {
  it("resolves every word used by the ten 40-line scenes", () => {
    const sentences = [...listeningSource.matchAll(/^\s*\["[^"]+",\s*"([^"]+)"/gm)].map((match) => match[1]);
    const words = new Set<string>();

    for (const sentence of sentences) {
      for (const raw of sentence.match(/[A-Za-z]+(?:[-'][A-Za-z]+)*/g) ?? []) {
        words.add(raw.toLowerCase().replace(/[^a-z]/g, ""));
      }
    }

    const unresolved = [...words].filter((word) => !resolvesToDictionary(word)).sort();

    expect(sentences).toHaveLength(400);
    expect(unresolved).toEqual([]);
  });
});

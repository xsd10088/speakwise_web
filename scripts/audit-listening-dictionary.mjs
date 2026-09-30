import fs from "node:fs";

const listeningPath = new URL("../client/src/components/ListeningTrainingView.tsx", import.meta.url);
const sentencePath = new URL("../client/src/components/InteractiveSentence.tsx", import.meta.url);
const listening = fs.readFileSync(listeningPath, "utf8");
const sentence = fs.readFileSync(sentencePath, "utf8");

const dictionary = new Set();
for (const match of sentence.matchAll(/^\s{2}([a-z0-9]+):\s*\{\s*phonetic:/gim)) {
  dictionary.add(match[1].toLowerCase());
}

const sentences = [...listening.matchAll(/^\s*\["[^"]+",\s*"([^"]+)"/gm)].map((match) => match[1]);
const words = new Set();
for (const text of sentences) {
  for (const raw of text.match(/[A-Za-z]+(?:[-'][A-Za-z]+)*/g) ?? []) {
    words.add(raw.toLowerCase().replace(/[^a-z]/g, ""));
  }
}

const suffixes = ["ies", "es", "s", "ed", "ing", "ly", "er", "est"];
function resolves(word) {
  if (dictionary.has(word)) return word;
  for (const suffix of suffixes) {
    if (!word.endsWith(suffix) || word.length - suffix.length < 2) continue;
    const base = word.slice(0, word.length - suffix.length);
    if (dictionary.has(base)) return base;
    if (base.length > 1 && base.at(-1) === base.at(-2)) {
      const reduced = base.slice(0, -1);
      if (dictionary.has(reduced)) return reduced;
    }
  }
  return null;
}

const unresolved = [...words].filter((word) => !resolves(word)).sort();
console.log(JSON.stringify({
  sentenceCount: sentences.length,
  uniqueWordCount: words.size,
  dictionaryEntryCount: dictionary.size,
  unresolvedCount: unresolved.length,
  unresolved,
}, null, 2));

import type { Trie } from "./core/trie";

export type AppState = {
  trie: Trie;
  grid: (string | null)[][];
  submittedWords: string[];
  score: number;
};

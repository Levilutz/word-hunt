import type { PointData } from "pixi.js";
import type { Trie } from "./core/trie";

export type PossibleAnswer = {
  word: string;
  paths: PointData[][];
};

export type GridAnalysis = {
  possibleAnswers: PossibleAnswer[];
  maxScore: number;
};

export type AppState = {
  trie: Trie;
  grid: (string | null)[][];
  submittedWords: string[];
  score: number;
  endTimeMs: number;
  gridAnalysis: GridAnalysis | undefined;
};

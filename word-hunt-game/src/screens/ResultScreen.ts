import { Container, Text } from "pixi.js";
import type Navigation from "../Navigation";
import type { AppScreen } from "../Navigation";
import type { AppState } from "../State";
import WordHuntWord from "../ui/WordHuntWord";
import WordHuntGrid from "../ui/WordHuntGrid";

export default class ResultScreen extends Container implements AppScreen {
  /** A reference to the global navigation instance. */
  private readonly _nav: Navigation;

  /** A reference to the global app state. */
  private readonly _appState: AppState;

  /** The width of the screen's area in Px. */
  private _w: number;

  /** The height of the screen's area in Px. */
  private _h: number;

  /** The grid. */
  private _wordHuntGrid: WordHuntGrid;

  /** The words to render in a list. */
  private _words: WordHuntWord[];

  /** The index of the currently-selected possible answer. */
  private _selectedInd?: number;

  constructor(nav: Navigation, appState: AppState, w: number, h: number) {
    super();
    this._nav = nav;
    this._appState = appState;
    this._w = w;
    this._h = h;

    this._wordHuntGrid = new WordHuntGrid(
      this._w * 0.2,
      50,
      Math.max(this._w * 0.6, 100),
      Math.max(this._h * 0.5 - 100, 100),
      { x: 0.5, y: 0 },
      this._appState.grid,
      [],
      "invalid",
      1,
    );
    this.addChild(this._wordHuntGrid);

    this._words = (this._appState.gridAnalysis?.possibleAnswers ?? []).map(
      (ans, i) => {
        const word = new WordHuntWord(
          this._w / 2,
          this._h / 2 + 25 + i * 50,
          ans.word,
          this._appState.submittedWords.includes(ans.word)
            ? "valid-new"
            : "invalid",
          { x: 0.5, y: 0 },
        );
        this.addChild(word);
        return word;
      },
    );
  }

  resize(w: number, h: number) {
    this._w = w;
    this._h = h;
  }
}

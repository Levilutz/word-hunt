import { Container } from "pixi.js";
import type Navigation from "../Navigation";
import type { AppScreen } from "../Navigation";
import type { AppState } from "../State";
import WordHuntGrid from "../ui/WordHuntGrid";
import WordHuntWord from "../ui/WordHuntWord";

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
        const word = new WordHuntWord(this._w / 2, this._h / 2 + 25 + i * 50, {
          text: ans.word,
          anchor: { x: 0.5, y: 0 },
          onPointerDown: () => this.handleWordClicked(i),
        });
        this.addChild(word);
        return word;
      },
    );
  }

  resize(w: number, h: number) {
    this._w = w;
    this._h = h;
  }

  private handleWordClicked(ind: number) {
    if (ind === this._selectedInd) {
      this._selectedInd = undefined;
      this._words[ind].setContent(
        this._appState.gridAnalysis?.possibleAnswers?.[ind]?.word ?? "",
        undefined,
      );
      this._wordHuntGrid.updatePath([], "invalid");
    } else {
      if (this._selectedInd !== undefined) {
        this._words[this._selectedInd].setContent(
          this._appState.gridAnalysis?.possibleAnswers?.[this._selectedInd]
            ?.word ?? "",
          undefined,
        );
      }
      this._selectedInd = ind;
      this._words[ind].setContent(
        this._appState.gridAnalysis?.possibleAnswers?.[ind]?.word ?? "",
        "invalid",
      );
      this._wordHuntGrid.updatePath(
        this._appState.gridAnalysis?.possibleAnswers?.[ind]?.paths?.[0] ?? [],
        "valid-new",
      );
    }
  }
}

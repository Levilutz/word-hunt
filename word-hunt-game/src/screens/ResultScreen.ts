import { sound } from "@pixi/sound";
import { Container, Graphics } from "pixi.js";
import type Navigation from "../Navigation";
import type { AppScreen } from "../Navigation";
import type { AppState } from "../State";
import Button from "../ui/Button";
import ScrollHitArea from "../ui/ScrollHitArea";
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

  /** The button to click left through paths. */
  private _leftButton: Button;

  /** The button to click right through paths. */
  private _rightButton: Button;

  /** The hit area for scrolling words. */
  private _wordsHitArea: ScrollHitArea;

  /** The current scroll of the words list. */
  private _wordsScroll = 0;

  /** A mask for ensuring words out of bounds don't render. */
  private _wordsMask: Graphics;

  /** The words to render in a list. */
  private _words: WordHuntWord[];

  /** The index of the currently-selected possible answer. */
  private _selectedInd?: number;

  /** The index of the path selected. */
  private _selectedPathInd: number = 0;

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

    this._leftButton = new Button(
      this._w * 0.5 - 25,
      this._h * 0.5 - 25,
      "",
      () => {
        sound.play("click");
      },
      () => {
        this.handlePathPage(-1);
      },
    );
    this.addChild(this._leftButton);

    this._rightButton = new Button(
      this._w * 0.5 + 25,
      this._h * 0.5 - 25,
      "",
      () => {
        sound.play("click");
      },
      () => {
        this.handlePathPage(1);
      },
    );
    this.addChild(this._rightButton);

    this._wordsHitArea = new ScrollHitArea(
      0,
      this._h * 0.5,
      this._w,
      this._h * 0.5,
      (px) => {
        this._wordsScroll = Math.min(
          Math.max(this._wordsScroll + px, 0),
          this._words.length * 50 - this._h / 2 + 25,
        );
        this._words.forEach((word, i) => {
          word.setPos(
            this._w / 2,
            this._h / 2 + 25 + i * 50 - this._wordsScroll,
          );
        });
      },
    );
    this.addChild(this._wordsHitArea);

    this._wordsMask = new Graphics();
    this._wordsMask
      .rect(0, this._h * 0.5, this._w, this._h * 0.5)
      .fill({ alpha: 0 });
    this.addChild(this._wordsMask);

    this._words = (this._appState.gridAnalysis?.possibleAnswers ?? []).map(
      (ans, i) => {
        const word = new WordHuntWord(
          this._w / 2,
          this._h / 2 + 25 + i * 50 + this._wordsScroll,
          {
            text: ans.word,
            anchor: { x: 0.5, y: 0 },
            onPointerDown: () => this.handleWordClicked(i),
          },
        );
        word.mask = this._wordsMask;
        this.addChild(word);
        return word;
      },
    );
  }

  resize(w: number, h: number) {
    this._w = w;
    this._h = h;
    this._wordsHitArea.resize(0, this._h * 0.5, this._w, this._h * 0.5);
  }

  private handleWordClicked(ind: number) {
    sound.play("click");
    if (ind === this._selectedInd) {
      this._selectedInd = undefined;
      this._words[ind].setContent(
        this._appState.gridAnalysis?.possibleAnswers?.[ind]?.word ?? "",
        undefined,
      );
      this._wordHuntGrid.updatePath([], "invalid");
      this._leftButton.setContent("");
      this._rightButton.setContent("");
    } else {
      if (this._selectedInd !== undefined) {
        this._words[this._selectedInd].setContent(
          this._appState.gridAnalysis?.possibleAnswers?.[this._selectedInd]
            ?.word ?? "",
          undefined,
        );
      }
      this._selectedInd = ind;
      this._selectedPathInd = 0;
      this._words[ind].setContent(
        this._appState.gridAnalysis?.possibleAnswers?.[ind]?.word ?? "",
        "invalid",
      );
      this._wordHuntGrid.updatePath(
        this._appState.gridAnalysis?.possibleAnswers?.[ind]?.paths?.[0] ?? [],
        "valid-new",
      );
      this.handlePathPage(0);
    }
  }

  private handlePathPage(dir: number) {
    if (this._selectedInd === undefined) {
      return;
    }
    const paths =
      this._appState.gridAnalysis?.possibleAnswers[this._selectedInd].paths ??
      [];
    if (
      this._selectedPathInd + dir < 0 ||
      this._selectedPathInd + dir >= paths.length
    ) {
      return;
    }
    this._selectedPathInd += dir;
    if (this._selectedPathInd === 0) {
      this._leftButton.setContent("");
    } else {
      this._leftButton.setContent("<");
    }
    if (this._selectedPathInd === paths.length - 1) {
      this._rightButton.setContent("");
    } else {
      this._rightButton.setContent(">");
    }
    this._wordHuntGrid.updatePath(
      this._appState.gridAnalysis?.possibleAnswers?.[this._selectedInd]
        ?.paths?.[this._selectedPathInd] ?? [],
      "valid-new",
    );
  }
}

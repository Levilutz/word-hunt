import { Container, type PointData } from "pixi.js";
import type { AppScreen } from "../Navigation";
import type { AppState } from "../State";
import WordHuntGrid from "../ui/WordHuntGrid";
import WordHuntGridHitArea from "../ui/WordHuntGridHitArea";
import WordHuntWord from "../ui/WordHuntWord";

export default class WordHuntScreen extends Container implements AppScreen {
  /** A reference to the global app state. */
  private readonly _appState: AppState;

  /** The width of the screen's area in Px. */
  private _w: number = 200;

  /** The height of the screen's area in Px. */
  private _h: number = 200;

  /** The current path of pressed tiles. */
  private _curPath: PointData[] = [];

  /** A child container for the grid of tiles. */
  private _wordHuntGrid: WordHuntGrid;

  /** A child container for managing the hit area over the grid. */
  private _wordHuntGridHitArea: WordHuntGridHitArea;

  /** A child container for showing the currently-selected word. */
  private _curWordPreview: WordHuntWord;

  constructor(appState: AppState, w: number, h: number) {
    super();

    this._appState = appState;

    this._w = w;
    this._h = h;

    this._wordHuntGrid = new WordHuntGrid(
      this._w * 0.125,
      200,
      Math.max(this._w * 0.75, 100),
      Math.max(this._h - 300, 100),
      { x: 0.5, y: 0 },
      this._appState.grid,
      this._curPath,
      "invalid",
    );
    this.addChild(this._wordHuntGrid);
    this._curWordPreview = new WordHuntWord(this._w / 2, 150, "", undefined);
    this.addChild(this._curWordPreview);
    this._wordHuntGridHitArea = new WordHuntGridHitArea(
      this._w,
      this._h,
      this._wordHuntGrid,
      this.handlePathHover.bind(this),
      this.handlePathSubmit.bind(this),
      true,
    );
    this.addChild(this._wordHuntGridHitArea);
  }

  resize(w: number, h: number) {
    // Update w and h top-level fields, and calculated fields
    this._w = w;
    this._h = h;

    this._wordHuntGrid.resize(
      this._w * 0.125,
      200,
      Math.max(this._w * 0.75, 100),
      Math.max(this._h - 300, 100),
    );
    this._wordHuntGridHitArea.resize(this._w, this._h);

    // Update text position
    this._curWordPreview.setPos(this._w / 2, 150);
  }

  private handlePathHover(path: PointData[]) {
    this._curPath = path;
    const _curWord = path
      .map(({ x, y }) => this._appState.grid[y][x] ?? "")
      .join("");
    const curWordType = this._appState.trie.containsWord(_curWord)
      ? this._appState.submittedWords.includes(_curWord)
        ? "valid-used"
        : "valid-new"
      : "invalid";
    this._curWordPreview.setContent(_curWord, curWordType);
    this._wordHuntGrid.updatePath(this._curPath, curWordType);
  }

  private handlePathSubmit(path: PointData[]) {
    const _curWord = path
      .map(({ x, y }) => this._appState.grid[y][x] ?? "")
      .join("");
    if (
      this._appState.trie.containsWord(_curWord) &&
      !this._appState.submittedWords.includes(_curWord)
    ) {
      this._appState.submittedWords.push(_curWord);
    }
    this.handlePathHover([]);
  }
}

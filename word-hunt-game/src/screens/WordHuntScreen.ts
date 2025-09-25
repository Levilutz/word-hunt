import { Container, type PointData } from "pixi.js";
import type { AppScreen } from "../Navigation";
import type { AppState } from "../State";
import WordHuntGrid from "../ui/WordHuntGrid";
import WordHuntGridHitArea from "../ui/WordHuntGridHitArea";
import WordHuntWord from "../ui/WordHuntWord";
import { getTilePx, gridSize } from "../utils";

// Constants
const minVSpace = 80;
const usedRatio = 0.75;
const spaceRatio = 0.1;

export default class WordHuntScreen extends Container implements AppScreen {
  private readonly _appState: AppState;

  /** The size of the logical grid of tiles. Typically 4x4. */
  private readonly _gridSize: PointData;

  /** The width of the screen's area in Px. */
  private _w: number = 200;
  /** The height of the screen's area in Px. */
  private _h: number = 200;

  /** The vertical space above and below the tile grid. */
  private _vSpace: number = minVSpace;
  /** The width and height of a single tile in Px. */
  private _tilePx: number = 40;
  /** The space between any two tiles in Px. */
  private _spacePx: number = 4;
  /** The pixel coordinates of the top-left corner of the first grid tile. */
  private _gridRenderStart: PointData = { x: 14, y: 14 };

  /** The current path of pressed tiles. */
  private _curPath: PointData[] = [];

  private _wordHuntGrid: WordHuntGrid;
  private _wordHuntGridHitArea: WordHuntGridHitArea;
  private _curWordPreview: WordHuntWord;

  constructor(appState: AppState, w: number, h: number) {
    super();

    this._appState = appState;
    this._gridSize = gridSize(this._appState.grid);

    this._w = w;
    this._h = h;
    this.updateCalculatedSizes();

    this._wordHuntGrid = new WordHuntGrid(
      this._w * (1 - usedRatio) * 0.5,
      this._h * (1 - usedRatio) * 0.5,
      this._w * usedRatio,
      this._h * usedRatio,
      { x: 0.5, y: 0 },
      this._appState.grid,
      this._curPath,
      "invalid",
    );
    this.addChild(this._wordHuntGrid);
    this._curWordPreview = new WordHuntWord(
      this._w / 2,
      this._gridRenderStart.y - minVSpace * 0.5,
      "",
      undefined,
    );
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
    this.updateCalculatedSizes();

    this._wordHuntGrid.resize(
      this._w * (1 - usedRatio) * 0.5,
      this._h * (1 - usedRatio) * 0.5,
      this._w * usedRatio,
      this._h * usedRatio,
    );
    this._wordHuntGridHitArea.resize(this._w, this._h);

    // Update text position
    this._curWordPreview.setPos(
      this._w / 2,
      this._gridRenderStart.y - minVSpace * 0.5,
    );
  }

  /** Update the sizes and positions of things dependent on width & height. */
  private updateCalculatedSizes() {
    this._vSpace = Math.max(this._h * (1 - usedRatio) * 0.5, minVSpace);
    this._tilePx = Math.min(
      getTilePx(this._w * usedRatio, spaceRatio, this._gridSize.x),
      getTilePx(
        Math.max(this._h - this._vSpace * 2, 1),
        spaceRatio,
        this._gridSize.y,
      ),
    );
    this._spacePx = this._tilePx * spaceRatio;
    const usedW =
      this._gridSize.x * this._tilePx + (this._gridSize.x - 1) * this._spacePx;
    const usedH =
      this._gridSize.y * this._tilePx + (this._gridSize.y - 1) * this._spacePx;
    this._gridRenderStart = {
      x: (this._w - usedW) / 2,
      y: (this._h - usedH) / 2,
    };
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

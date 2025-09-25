import { Container, Graphics, type PointData, Text } from "pixi.js";
import type { AppScreen } from "../Navigation";
import type { AppState } from "../State";
import theme, { type WordType } from "../theme";
import WordHuntGrid from "../ui/WordHuntGrid";
import WordHuntGridHitArea from "../ui/WordHuntGridHitArea";
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

  /** The child container for graphics overlaid on top of the tiles. */
  private readonly _graphics = new Graphics();

  /** The child for text showing the current word. */
  private readonly _curWordText = new Text({
    text: "",
    anchor: 0.5,
    style: {
      fill: 0x000000,
      fontSize: 24,
      fontFamily: "Helvetica Neue Bold",
    },
  });

  /** The current path of pressed tiles. Must stay in-sync with `curWord`. */
  private _curPath: PointData[] = [];

  /** The current word from pressed tiles. Must stay in-sync with `curPath`. */
  private _curWord: string = "";

  /** The type of the current word. */
  private _curWordType: WordType = "invalid";

  private _wordHuntGrid: WordHuntGrid;
  private _wordHuntGridHitArea: WordHuntGridHitArea;

  constructor(appState: AppState, w: number, h: number) {
    super();

    this._appState = appState;
    this._gridSize = gridSize(this._appState.grid);

    this._w = w;
    this._h = h;
    this.updateCalculatedSizes();

    this._curWordText.x = this._w / 2;
    this._curWordText.y = this._gridRenderStart.y - minVSpace * 0.5;

    this.addChild(this._graphics);
    this.addChild(this._curWordText);

    this._wordHuntGrid = new WordHuntGrid(
      this._gridRenderStart.x,
      this._gridRenderStart.y,
      this._tilePx * this._gridSize.x + this._spacePx * (this._gridSize.x - 1),
      this._tilePx * this._gridSize.y + this._spacePx * (this._gridSize.y - 1),
      this._appState.grid,
      this._curPath,
      this._curWordType,
    );
    this.addChild(this._wordHuntGrid);
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
      this._gridRenderStart.x,
      this._gridRenderStart.y,
      this._tilePx * this._gridSize.x + this._spacePx * (this._gridSize.x - 1),
      this._tilePx * this._gridSize.y + this._spacePx * (this._gridSize.y - 1),
    );
    this._wordHuntGridHitArea.resize(this._w, this._h);

    // Update text position
    this._curWordText.x = this._w / 2;
    this._curWordText.y = this._gridRenderStart.y - minVSpace * 0.5;

    // Update graphics
    this.updateGraphics();
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
    this._curWord = path
      .map(({ x, y }) => this._appState.grid[y][x] ?? "")
      .join("");
    this._curWordText.text = this._curWord;
    this._curWordType = this._appState.trie.containsWord(this._curWord)
      ? this._appState.submittedWords.includes(this._curWord)
        ? "valid-used"
        : "valid-new"
      : "invalid";
    this._wordHuntGrid.updatePath(this._curPath, this._curWordType);
    this.updateGraphics();
  }

  private handlePathSubmit(path: PointData[]) {
    this._curWord = path
      .map(({ x, y }) => this._appState.grid[y][x] ?? "")
      .join("");
    if (
      this._appState.trie.containsWord(this._curWord) &&
      !this._appState.submittedWords.includes(this._curWord)
    ) {
      this._appState.submittedWords.push(this._curWord);
    }
    this.handlePathHover([]);
  }

  /** Update all graphics. */
  private updateGraphics() {
    this._graphics.clear();
    this.renderTextBg();
  }

  /** Render the background on the current word text. */
  private renderTextBg() {
    if (this._curPath.length === 0) {
      return;
    }
    const color =
      this._curWordType === "invalid"
        ? theme.default
        : theme.wordTypes[this._curWordType];
    const pad: PointData = { x: 10, y: 5 };
    this._graphics
      .roundRect(
        this._curWordText.x - this._curWordText.width * 0.5 - pad.x,
        this._curWordText.y - this._curWordText.height * 0.5 - pad.y,
        this._curWordText.width + pad.x * 2,
        this._curWordText.height + pad.y * 2,
        10,
      )
      .fill({ color });
  }
}

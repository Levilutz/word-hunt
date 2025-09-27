import { Container, Graphics, type PointData } from "pixi.js";
import type { WordType } from "../theme";
import {
  getTilePx,
  gridSize,
  pointAdd,
  pointInList,
  pointScale,
  pointSub,
} from "../utils";
import WordHuntTile from "./WordHuntTile";

const TILE_SPACE_RATIO = 0.1;

export default class WordHuntGrid extends Container {
  /** The max width (in px) the grid may consume. */
  private _w: number;

  /** The max height (in px) the grid may consume. */
  private _h: number;

  /** The visual scale of the tiles (for animation). */
  private _tileScale: number;

  /** The anchor position. */
  private readonly _anchor: PointData;

  /** The position of the top-left corner of the grid. */
  private _gridRenderStart: PointData = { x: 0, y: 0 };

  /** The current path drawn over the grid. */
  private _curPath: PointData[] = [];

  /** The type of the word demarcated by `_curPath`. */
  private _curWordType: WordType = "invalid";

  /** The logical size of the grid. */
  private readonly _gridSize: PointData;

  /** The size of each tile, in px. */
  private _tilePx: number = 40;

  /** The space between each tile, in px. */
  private _spacePx: number = 4;

  /** The child objects for each tile. */
  private readonly _tiles: (WordHuntTile | null)[][];

  /** The child object for the path drawn over the grid. */
  private readonly _path = new Graphics();

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    anchor: PointData,
    grid: (string | null)[][],
    path: PointData[],
    wordType: WordType,
    tileScale?: number,
  ) {
    super({ x, y });
    this._w = width;
    this._h = height;
    this._tileScale = tileScale ?? 1;
    this._anchor = anchor;
    this._curPath = path;
    this._curWordType = wordType;

    this._gridSize = gridSize(grid);
    this.updateCalculatedSizes();

    this._tiles = grid.map((row, y) =>
      row.map((value, x) => {
        if (value === null) {
          return null;
        }
        const tilePos = this.logicalToPixel({ x, y });
        const reduction = this._tilePx * (1 - this._tileScale);
        const tile = new WordHuntTile(
          tilePos.x + reduction * 0.5,
          tilePos.y + reduction * 0.5,
          this._tilePx - reduction,
          value,
        );
        if (pointInList(this._curPath, { x, y })) {
          tile.setMode(this._curWordType);
        }
        this.addChild(tile);
        return tile;
      }),
    );
    this.addChild(this._path);
    this.renderPath();
  }

  /** Resize and/or reposition the grid. */
  resize(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this._w = w;
    this._h = h;
    this.updateCalculatedSizes();
    this._tiles.forEach((row, y) => {
      row.forEach((tile, x) => {
        if (tile === null) {
          return;
        }
        const tilePos = this.logicalToPixel({ x, y });
        const reduction = this._tilePx * (1 - this._tileScale);
        tile.setBounds(
          tilePos.x + reduction * 0.5,
          tilePos.y + reduction * 0.5,
          this._tilePx - reduction,
        );
      });
    });
    this.renderPath();
  }

  /** Update the path and word type. */
  updatePath(path: PointData[], wordType: WordType) {
    this._curPath = path;
    this._curWordType = wordType;
    this._tiles.forEach((row, y) => {
      row.forEach((tile, x) => {
        if (tile === null) {
          return;
        }
        if (pointInList(this._curPath, { x, y })) {
          tile.setMode(this._curWordType);
        } else {
          tile.setMode(undefined);
        }
      });
    });
    this.renderPath();
  }

  /** Get the visual tile scale (for animation). */
  get tileScale(): number {
    return this._tileScale;
  }

  /** Set the visual tile scale (for animation). */
  set tileScale(tileScale: number) {
    if (tileScale === this._tileScale) {
      return;
    }
    this._tileScale = tileScale;
    this._tiles.forEach((row, y) => {
      row.forEach((tile, x) => {
        if (tile === null) {
          return;
        }
        const tilePos = this.logicalToPixel({ x, y });
        const reduction = this._tilePx * (1 - this._tileScale);
        tile.setBounds(
          tilePos.x + reduction * 0.5,
          tilePos.y + reduction * 0.5,
          this._tilePx - reduction,
        );
      });
    });
  }

  /** Get the calculated tilePx. */
  get tilePx(): number {
    return this._tilePx;
  }

  /** Get the calculated spacePx. */
  get spacePx(): number {
    return this._spacePx;
  }

  /** Given a point in logical tile space, scale it to pixel space. */
  logicalToPixel(p: PointData, wide?: boolean): PointData {
    let out = pointAdd(
      pointScale(p, this._tilePx + this._spacePx),
      this._gridRenderStart,
    );
    if (wide) {
      out = pointSub(out, { x: this._spacePx * 0.5, y: this._spacePx * 0.5 });
    }
    return out;
  }

  /** Given a point in pixel space, scale it to logical tile space. */
  pixelToLogical(p: PointData, wide?: boolean): PointData {
    if (wide) {
      p = pointAdd(p, { x: this._spacePx * 0.5, y: this._spacePx * 0.5 });
    }
    return pointScale(
      pointSub(p, this._gridRenderStart),
      1 / (this._tilePx + this._spacePx),
    );
  }

  /** Check whether the given tile exists. */
  tileExists(p: PointData): boolean {
    return this._tiles?.[p.y]?.[p.x] != null;
  }

  /** Get logical coordinates for every tile. */
  allTileCoords(): PointData[] {
    return this._tiles
      .flatMap((row, y) =>
        row.map((tile, x) => {
          if (tile === null) {
            return null;
          }
          return { x, y };
        }),
      )
      .filter((p) => p !== null);
  }

  /** Update the calculated tilePx, spacePx, and gridRenderStart based on new _w and _h. */
  private updateCalculatedSizes() {
    this._tilePx = Math.min(
      getTilePx(this._w, TILE_SPACE_RATIO, this._gridSize.x),
      getTilePx(this._h, TILE_SPACE_RATIO, this._gridSize.y),
    );
    this._spacePx = this._tilePx * TILE_SPACE_RATIO;
    const consumed = pointAdd(
      pointScale(this._gridSize, this._tilePx),
      pointScale(pointSub(this._gridSize, { x: 1, y: 1 }), this._spacePx),
    );
    const free = pointSub({ x: this._w, y: this._h }, consumed);
    this._gridRenderStart = {
      x: free.x * this._anchor.x,
      y: free.y * this._anchor.y,
    };
  }

  /** Render the path over the tiles. */
  private renderPath() {
    this._path.clear();
    if (this._curPath.length === 0) {
      return;
    }
    const color = this._curWordType === "invalid" ? 0xff0000 : 0xffffff;
    this._curPath.forEach((tileCoords, i) => {
      const pos = pointAdd(this.logicalToPixel(tileCoords), {
        x: this._tilePx * 0.5,
        y: this._tilePx * 0.5,
      });
      if (i > 0) {
        this._path
          .lineTo(pos.x, pos.y)
          .stroke({ width: this._tilePx * 0.1, color });
      }
      this._path.circle(pos.x, pos.y, this._tilePx * 0.05).fill({ color });
      this._path.moveTo(pos.x, pos.y);
    });
    this._path.closePath();
  }
}

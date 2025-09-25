import { Container, Graphics, type PointData } from "pixi.js";
import type { WordType } from "../theme";
import {
  getTilePx,
  gridSize,
  pointAdd,
  pointInList,
  pointScale,
} from "../utils";
import WordHuntTile from "./WordHuntTile";

const TILE_SPACE_RATIO = 0.1;

export default class WordHuntGrid extends Container {
  /** The max width (in px) the grid may consume. */
  private _w: number;

  /** The max height (in px) the grid may consume. */
  private _h: number;

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
    grid: (string | null)[][],
    path: PointData[],
    wordType: WordType,
  ) {
    super({ x, y });
    this._w = width;
    this._h = height;
    this._curPath = path;
    this._curWordType = wordType;

    this._gridSize = gridSize(grid);
    this.updateCalculatedSizes();

    this._tiles = grid.map((row, y) =>
      row.map((value, x) => {
        if (value === null) {
          return null;
        }
        const tilePos = pointScale({ x, y }, this._tilePx + this._spacePx);
        const tile = new WordHuntTile(
          tilePos.x,
          tilePos.y,
          this._tilePx,
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
        const tilePos = pointScale({ x, y }, this._tilePx + this._spacePx);
        tile.setBounds(tilePos.x, tilePos.y, this._tilePx);
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

  /** Get the current path. */
  get path(): PointData[] {
    return this._curPath;
  }

  /** Given a point in pixel space, scale it to logical tile space. */
  scaleForTiles(p: PointData): PointData {
    return pointScale(
      pointAdd(p, { x: this._spacePx * 0.5, y: this._spacePx * 0.5 }),
      1 / (this._tilePx + this._spacePx),
    );
  }

  /** Update the calculated tilePx and spacePx based on new _w and _h. */
  private updateCalculatedSizes() {
    this._tilePx = Math.min(
      getTilePx(this._w, TILE_SPACE_RATIO, this._gridSize.x),
      getTilePx(this._h, TILE_SPACE_RATIO, this._gridSize.y),
    );
    this._spacePx = this._tilePx * TILE_SPACE_RATIO;
  }

  /** Render the path over the tiles. */
  private renderPath() {
    this._path.clear();
    if (this._curPath.length === 0) {
      return;
    }
    const color = this._curWordType === "invalid" ? 0xff0000 : 0xffffff;
    this._curPath.forEach((tileCoords, i) => {
      const pos = pointAdd(
        pointScale(tileCoords, this._tilePx + this._spacePx),
        {
          x: this._tilePx * 0.5,
          y: this._tilePx * 0.5,
        },
      );
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

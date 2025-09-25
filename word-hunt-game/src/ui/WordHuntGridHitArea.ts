import {
  Container,
  type FederatedPointerEvent,
  type PointData,
  Rectangle,
} from "pixi.js";
import {
  pointAdjacent,
  pointFloor,
  pointInList,
  pointSub,
  thickRasterCircles,
} from "../utils";
import type WordHuntGrid from "./WordHuntGrid";

export default class WordHuntGridHitArea extends Container {
  /** A reference to the grid underlying this hit area. Used to pull tile sizes etc. */
  private readonly _gridRef: WordHuntGrid;

  /** A callback for when a new path is hovered over. */
  private readonly _onPathHover?: (path: PointData[]) => void;

  /** A callback for when a path is submitted. */
  private readonly _onPathSubmit?: (path: PointData[]) => void;

  /** The last position the pointer was seen in. */
  private _lastPos: PointData = { x: 0, y: 0 };

  /** The current path. */
  private _curPath: PointData[] = [];

  constructor(
    width: number,
    height: number,
    grid: WordHuntGrid,
    onPathHover?: (path: PointData[]) => void,
    onPathSubmit?: (path: PointData[]) => void,
  ) {
    super({ x: 0, y: 0, interactive: true });
    this.hitArea = new Rectangle(0, 0, width, height);
    this._gridRef = grid;
    this._onPathHover = onPathHover;
    this._onPathSubmit = onPathSubmit;
    this.on("pointerup", this.handlePointerUp.bind(this));
    this.on("pointerdown", this.handlePointerDown.bind(this));
    this.on("pointermove", this.handlePointerMove.bind(this));
  }

  resize(w: number, h: number) {
    this.hitArea = new Rectangle(0, 0, w, h);
  }

  /** Handle a pointerup event over our hit area. */
  private handlePointerUp() {
    if (this._curPath.length > 0) {
      this._onPathSubmit?.(this._curPath);
    }
    this._curPath = [];
  }

  /** Handle a pointerdown event over our hit area. */
  private handlePointerDown({ global }: FederatedPointerEvent) {
    const { x, y } = global;
    const tilePos = pointFloor(this.scaleForGrid({ x, y }));
    if (this._gridRef.tileExists(tilePos)) {
      this._curPath = [tilePos];
    } else {
      this._curPath = [];
    }
    this._onPathHover?.(this._curPath);
    this._lastPos = { x, y };
  }

  /** Handle a pointermove event over our hit area. */
  private handlePointerMove({ global, buttons }: FederatedPointerEvent) {
    const { x, y } = global;
    if (buttons === 0) {
      this.handlePointerUp();
    } else if (this._curPath.length > 0) {
      const affected = thickRasterCircles(
        this.scaleForGrid(this._lastPos),
        this.scaleForGrid({ x, y }),
      );
      let tilesAdded = false;
      for (const tilePos of affected) {
        if (pointInList(this._curPath, tilePos)) {
        } else if (
          pointAdjacent(this._curPath[this._curPath.length - 1], tilePos) &&
          this._gridRef.tileExists(tilePos)
        ) {
          this._curPath.push(tilePos);
          tilesAdded = true;
        } else {
          break;
        }
      }
      if (tilesAdded) {
        this._onPathHover?.(this._curPath);
      }
    }
    this._lastPos = { x, y };
  }

  /** Given pixel-space coordinates, scale to grid logical space. */
  private scaleForGrid(p: PointData): PointData {
    return this._gridRef.scaleForTiles(pointSub(p, this._gridRef));
  }
}

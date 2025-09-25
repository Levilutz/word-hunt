import {
  Container,
  type FederatedPointerEvent,
  Graphics,
  type PointData,
  Rectangle,
} from "pixi.js";
import {
  distanceSquared,
  pointAdd,
  pointAdjacent,
  pointFloor,
  pointInList,
  pointInRect,
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

  /** Debug graphics. */
  private _debug?: Graphics;

  constructor(
    width: number,
    height: number,
    grid: WordHuntGrid,
    onPathHover?: (path: PointData[]) => void,
    onPathSubmit?: (path: PointData[]) => void,
    debug?: boolean,
  ) {
    super({ x: 0, y: 0, interactive: true });
    this.hitArea = new Rectangle(0, 0, width, height);
    this._gridRef = grid;
    this._onPathHover = onPathHover;
    this._onPathSubmit = onPathSubmit;
    if (debug) {
      this._debug = new Graphics();
      this.addChild(this._debug);
    }
    this.on("pointerup", this.handlePointerUp.bind(this));
    this.on("pointerdown", this.handlePointerDown.bind(this));
    this.on("pointermove", this.handlePointerMove.bind(this));
    this.updateDebug();
  }

  resize(w: number, h: number) {
    this.hitArea = new Rectangle(0, 0, w, h);
    this.updateDebug();
  }

  /** Handle a pointerup event over our hit area. */
  private handlePointerUp() {
    if (this._curPath.length > 0) {
      this._onPathSubmit?.(this._curPath);
    }
    this._curPath = [];
    this.updateDebug();
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
    this.updateDebug();
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
    this.updateDebug();
  }

  /** Given pixel-space coordinates, scale to grid logical space. */
  private scaleForGrid(p: PointData): PointData {
    return this._gridRef.pixelToLogical(pointSub(p, this._gridRef), true);
  }

  /** Update debug graphics if appropriate. */
  private updateDebug() {
    if (this._debug === undefined) {
      return;
    }
    this._debug.clear();
    const { tilePx, spacePx } = this._gridRef;
    const tileCoords = this._gridRef.allTileCoords();
    if (this._curPath.length === 0) {
      tileCoords.forEach((coords) => {
        const tilePos = pointAdd(
          this._gridRef.logicalToPixel(coords, true),
          this._gridRef,
        );
        const sideLength = tilePx + spacePx;
        const hovered = pointInRect(
          this._lastPos,
          tilePos,
          pointAdd(tilePos, { x: sideLength, y: sideLength }),
        );
        this._debug
          ?.rect(tilePos.x, tilePos.y, sideLength - 1, sideLength - 1)
          .stroke({ width: 1, color: hovered ? 0xff00ff : 0x00ff00 });
      });
    } else {
      tileCoords.forEach((coords) => {
        const tilePos = pointAdd(
          pointAdd(this._gridRef.logicalToPixel(coords), this._gridRef),
          { x: tilePx * 0.5, y: tilePx * 0.5 },
        );
        const r = (tilePx + spacePx) * 0.5;
        const hovered = distanceSquared(tilePos, this._lastPos) <= r ** 2;
        this._debug
          ?.circle(tilePos.x, tilePos.y, r - 0.5)
          .stroke({ width: 1, color: hovered ? 0xff00ff : 0x00ff00 });
      });
    }
  }
}

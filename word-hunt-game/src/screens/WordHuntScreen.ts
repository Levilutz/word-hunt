import {
  Container,
  type FederatedPointerEvent,
  Graphics,
  type PointData,
  Rectangle,
} from "pixi.js";
import type { AppScreen } from "../Navigation";
import type { AppState } from "../State";
import {
  pointScale,
  pointSub,
  thickRaster,
  thickRasterCircles,
} from "../utils";

interface Point {
  x: number;
  y: number;
}

export default class WordHuntScreen extends Container implements AppScreen {
  private appState: AppState;

  private _w: number;
  private _h: number;

  private readonly _hitContainer = new Container();
  private readonly _hitArea = new Rectangle();

  private readonly _graphics = new Graphics();
  private pointerDown = false;
  private lastPos: Point = { x: 0, y: 0 };
  private pointDownPos: PointData | undefined = undefined;

  constructor(appState: AppState, w: number, h: number) {
    super();

    this.appState = appState;
    this._w = w;
    this._h = h;

    this.addChild(this._graphics);

    this._hitContainer.interactive = true;
    this._hitContainer.hitArea = this._hitArea;
    this.addChild(this._hitContainer);

    this._hitContainer.on("pointerup", this.handlePointerUp.bind(this));
    this._hitContainer.on("pointerdown", this.handlePointerDown.bind(this));
    this._hitContainer.on("pointermove", this.handlePointerMove.bind(this));

    this.renderTiles();
  }

  resize(w: number, h: number) {
    this._w = w;
    this._h = h;
    this._hitArea.width = w;
    this._hitArea.height = h;
  }

  private handlePointerUp(_event: FederatedPointerEvent) {
    this.pointerDown = false;
  }

  private handlePointerDown({ global }: FederatedPointerEvent) {
    const { x, y } = global;
    this.pointerDown = true;
    this.pointDownPos = { x, y };
  }

  private handlePointerMove({ global }: FederatedPointerEvent) {
    const { x, y } = global;
    this.lastPos = { x, y };
    this.renderTiles();
  }

  private gridSize(): { w: number; h: number } {
    return {
      w:
        this.appState.grid.length > 0
          ? Math.max(...this.appState.grid.map((row) => row.length))
          : 0,
      h: this.appState.grid.length,
    };
  }

  private renderTiles() {
    const tilePx = 70;
    const spacePx = 7;
    this._graphics.clear();
    let highlight1: PointData[] = [];
    let highlight2: PointData[] = [];
    if (this.pointDownPos !== undefined) {
      highlight1 = thickRaster(
        pointScale(
          pointSub(this.pointDownPos, { x: spacePx / 2, y: spacePx / 2 }),
          1 / (tilePx + spacePx),
        ),
        pointScale(
          pointSub(this.lastPos, { x: spacePx / 2, y: spacePx / 2 }),
          1 / (tilePx + spacePx),
        ),
      );
      highlight2 = thickRasterCircles(
        pointScale(
          pointSub(this.pointDownPos, { x: spacePx / 2, y: spacePx / 2 }),
          1 / (tilePx + spacePx),
        ),
        pointScale(
          pointSub(this.lastPos, { x: spacePx / 2, y: spacePx / 2 }),
          1 / (tilePx + spacePx),
        ),
      );
    }
    console.log(highlight1);
    this.appState.grid.forEach((row, y) => {
      row.forEach((contents, x) => {
        const x1 = (tilePx + spacePx) * x + spacePx;
        const y1 = (tilePx + spacePx) * y + spacePx;
        // const { x: lastX, y: lastY } = this.lastPos;
        // const hovered =
        //   lastX >= x1 &&
        //   lastX < x1 + tilePx &&
        //   lastY >= y1 &&
        //   lastY < y1 + tilePx;

        const highlighted1 = highlight1.some(
          (pos) => pos.x === x && pos.y === y,
        );
        const highlighted2 = highlight2.some(
          (pos) => pos.x === x && pos.y === y,
        );
        this._graphics.rect(x1, y1, tilePx, tilePx).fill({
          color: highlighted2 ? 0xff0000 : highlighted1 ? 0x0000ff : 0x00ff00,
        });
        this._graphics
          .circle(x1 + tilePx / 2, y1 + tilePx / 2, (tilePx + spacePx) / 2)
          .stroke({ width: 1, color: 0x000000 });
      });
    });
    if (this.pointDownPos !== undefined) {
      this._graphics
        .moveTo(this.pointDownPos.x, this.pointDownPos.y)
        .lineTo(this.lastPos.x, this.lastPos.y)
        .stroke({ width: 2, color: 0x00ff00 });
    }
  }
}

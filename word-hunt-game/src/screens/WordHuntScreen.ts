import {
  Container,
  type FederatedPointerEvent,
  Graphics,
  Rectangle,
} from "pixi.js";
import type { AppScreen } from "../Navigation";
import type { AppState } from "../State";

export default class WordHuntScreen extends Container implements AppScreen {
  private appState: AppState;

  private readonly _hitContainer = new Container();
  private readonly _hitArea = new Rectangle();

  private readonly _graphics = new Graphics();
  private lastPos: { x: number; y: number } = { x: 0, y: 0 };

  constructor(appState: AppState) {
    super();

    this.appState = appState;

    this.addChild(this._graphics);

    this._hitContainer.interactive = true;
    this._hitContainer.hitArea = this._hitArea;
    this.addChild(this._hitContainer);

    this._hitContainer.on("pointerup", this.handlePointerUp.bind(this));
    this._hitContainer.on("pointerdown", this.handlePointerDown.bind(this));
    this._hitContainer.on("pointermove", this.handlePointerMove.bind(this));
  }

  resize(w: number, h: number) {
    this._hitArea.width = w;
    this._hitArea.height = h;
  }

  private handlePointerUp(_event: FederatedPointerEvent) {}

  private handlePointerDown(_event: FederatedPointerEvent) {}

  private handlePointerMove({ global }: FederatedPointerEvent) {
    const { x, y } = global;
    this._graphics.clear();
    this._graphics
      .moveTo(this.lastPos.x, this.lastPos.y)
      .lineTo(x, y)
      .stroke({ width: 1, color: 0xff00ff });
    this.lastPos = { x, y };
  }
}

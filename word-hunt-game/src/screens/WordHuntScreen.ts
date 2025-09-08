import { Container, type FederatedPointerEvent, Rectangle } from "pixi.js";
import type { AppScreen } from "../Navigation";

export default class WordHuntScreen extends Container implements AppScreen {
  private readonly _hitContainer = new Container();
  private readonly _hitArea = new Rectangle();

  constructor() {
    super();

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

  private handlePointerMove(_event: FederatedPointerEvent) {}
}

import {
  Container,
  type DestroyOptions,
  type FederatedPointerEvent,
  type FederatedWheelEvent,
  Rectangle,
} from "pixi.js";

export default class ScrollHitArea extends Container {
  private readonly _boundHandlePointerUp: (event: PointerEvent) => void;

  constructor(x: number, y: number, width: number, height: number) {
    super({ x, y, interactive: true });
    this.hitArea = new Rectangle(0, 0, width, height);
    this._boundHandlePointerUp = this.handlePointerUp.bind(this);
    document.addEventListener("pointerup", this._boundHandlePointerUp);
    this.on("pointerdown", this.handlePointerDown.bind(this));
    this.on("pointermove", this.handlePointerMove.bind(this));
    this.on("wheel", this.handleWheel.bind(this));
  }

  resize(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.hitArea = new Rectangle(0, 0, w, h);
  }

  destroy(options?: DestroyOptions) {
    document.removeEventListener("pointerup", this._boundHandlePointerUp);
    super.destroy(options);
  }

  private handlePointerUp(_event: PointerEvent) {
    console.log("pointerup!");
  }

  private handlePointerDown(_event: FederatedPointerEvent) {
    console.log("pointerdown!");
  }

  private handlePointerMove(_event: FederatedPointerEvent) {
    console.log("pointermove!");
  }

  private handleWheel(_event: FederatedWheelEvent) {
    console.log("wheel!");
  }
}

import {
  Container,
  type DestroyOptions,
  type FederatedPointerEvent,
  type FederatedWheelEvent,
  type PointData,
  Rectangle,
} from "pixi.js";

export default class ScrollHitArea extends Container {
  private _pressed = false;
  private _lastPos: PointData = { x: 0, y: 0 };
  private readonly _boundHandlePointerUp: (event: PointerEvent) => void;
  private readonly _boundHandlePointerMove: (event: PointerEvent) => void;
  private readonly _onScroll?: (px: number) => void;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    onScroll?: (px: number) => void,
  ) {
    super({ x, y, interactive: true });
    this._onScroll = onScroll;
    this.hitArea = new Rectangle(0, 0, width, height);
    this._boundHandlePointerUp = this.handlePointerUp.bind(this);
    document.addEventListener("pointerup", this._boundHandlePointerUp);
    this._boundHandlePointerMove = this.handlePointerMove.bind(this);
    document.addEventListener("pointermove", this._boundHandlePointerMove);
    this.on("pointerdown", this.handlePointerDown.bind(this));
    this.on("wheel", this.handleWheel.bind(this));
  }

  resize(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.hitArea = new Rectangle(0, 0, w, h);
  }

  destroy(options?: DestroyOptions) {
    document.removeEventListener("pointerup", this._boundHandlePointerUp);
    document.removeEventListener("pointermove", this._boundHandlePointerMove);
    super.destroy(options);
  }

  private handlePointerUp(_event: PointerEvent) {
    this._pressed = false;
  }

  private handlePointerDown({ global }: FederatedPointerEvent) {
    const { x, y } = global;
    this._pressed = true;
    this._lastPos = { x, y };
  }

  private handlePointerMove({ x, y }: PointerEvent) {
    if (!this._pressed) {
      return;
    }
    this._onScroll?.(this._lastPos.y - y);
    this._lastPos = { x, y };
  }

  private handleWheel({ deltaY }: FederatedWheelEvent) {
    this._onScroll?.(deltaY);
  }
}

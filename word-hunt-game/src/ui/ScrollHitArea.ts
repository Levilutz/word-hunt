import {
  Container,
  type DestroyOptions,
  type PointData,
  Rectangle,
} from "pixi.js";

export default class ScrollHitArea extends Container {
  private _w: number;
  private _h: number;
  private _pressed = false;
  private _lastPos: PointData = { x: 0, y: 0 };
  private readonly _boundHandlePointerUp: (event: PointerEvent) => void;
  private readonly _boundHandlePointerMove: (event: PointerEvent) => void;
  private readonly _boundHandlePointerDown: (event: PointerEvent) => void;
  private readonly _boundHandleWheel: (event: WheelEvent) => void;
  private readonly _onScroll?: (px: number) => void;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    onScroll?: (px: number) => void,
  ) {
    super({ x, y });
    this._w = width;
    this._h = height;
    this._onScroll = onScroll;
    this.hitArea = new Rectangle(0, 0, width, height);
    this._boundHandlePointerUp = this.handlePointerUp.bind(this);
    document.addEventListener("pointerup", this._boundHandlePointerUp);
    this._boundHandlePointerDown = this.handlePointerDown.bind(this);
    document.addEventListener("pointerdown", this._boundHandlePointerDown);
    this._boundHandlePointerMove = this.handlePointerMove.bind(this);
    document.addEventListener("pointermove", this._boundHandlePointerMove);
    this._boundHandleWheel = this.handleWheel.bind(this);
    document.addEventListener("wheel", this._boundHandleWheel);
    this.on("wheel", this.handleWheel.bind(this));
  }

  resize(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this._w = w;
    this._h = h;
    this.hitArea = new Rectangle(0, 0, w, h);
  }

  destroy(options?: DestroyOptions) {
    document.removeEventListener("pointerup", this._boundHandlePointerUp);
    document.removeEventListener("pointerdown", this._boundHandlePointerDown);
    document.removeEventListener("pointermove", this._boundHandlePointerMove);
    document.removeEventListener("wheel", this._boundHandleWheel);
    super.destroy(options);
  }

  private handlePointerUp(_event: PointerEvent) {
    this._pressed = false;
  }

  private handlePointerDown({ x, y }: PointerEvent) {
    if (!this.contains(x, y)) {
      return;
    }
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

  private handleWheel({ x, y, deltaY }: WheelEvent) {
    if (!this.contains(x, y)) {
      return;
    }
    this._onScroll?.(deltaY);
  }

  private contains(x: number, y: number) {
    return new Rectangle(this.x, this.y, this._w, this._h).contains(x, y);
  }
}

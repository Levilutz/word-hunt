import {
  Container,
  type DestroyOptions,
  Graphics,
  type PointData,
  Text,
} from "pixi.js";
import theme from "../theme";

export default class Button extends Container {
  private readonly _text: Text;
  private readonly _graphics = new Graphics();
  private readonly _onPress?: () => void;
  private readonly _onRelease?: () => void;
  private _pressed = false;

  constructor(
    x: number,
    y: number,
    text: string,
    onPress?: () => void,
    onRelease?: () => void,
  ) {
    super({ x, y, interactive: true });
    this._onPress = onPress;
    this._onRelease = onRelease;
    this.addChild(this._graphics);
    this._text = new Text({
      text,
      anchor: 0.5,
      style: {
        fill: 0x000000,
        fontSize: 24,
        fontFamily: "Helvetica Neue Bold",
      },
    });
    this.addChild(this._text);
    this.renderBg();
    document.addEventListener("pointerup", this.handlePointerUp.bind(this));
    this.on("pointerdown", this.handlePointerDown.bind(this));
  }

  setPos(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.renderBg();
  }

  setContent(text: string) {
    this._text.text = text;
    this.renderBg();
  }

  destroy(options?: DestroyOptions) {
    document.removeEventListener("pointerup", this.handlePointerUp.bind(this));
    super.destroy(options);
  }

  private handlePointerUp() {
    if (!this._pressed) {
      return;
    }
    this._pressed = false;
    this.renderBg();
    this._onRelease?.();
  }

  private handlePointerDown() {
    if (this._pressed) {
      return;
    }
    this._pressed = true;
    this.renderBg();
    this._onPress?.();
  }

  private renderBg() {
    this._graphics.clear();
    if (this._text.text.length === 0) {
      return;
    }
    const { width, height } = this._text;
    const pad: PointData = {
      x: 10 + (this._pressed ? width * 0.025 : 0),
      y: 5 + (this._pressed ? height * 0.025 : 0),
    };
    this._graphics
      .roundRect(
        this._text.x - width * 0.5 - pad.x,
        this._text.y - height * 0.5 - pad.y,
        width + pad.x * 2,
        height + pad.y * 2,
        10,
      )
      .fill({ color: this._pressed ? theme.wordTypes.invalid : theme.default });
  }
}

import { Container, Graphics, type PointData, Text } from "pixi.js";
import type { WordType } from "../theme";
import theme from "../theme";

export default class WordHuntWord extends Container {
  private _mode: WordType | undefined = undefined;
  private readonly _text: Text;
  private readonly _graphics = new Graphics();

  constructor(
    x: number,
    y: number,
    options?: {
      text?: string;
      mode?: WordType;
      anchor?: PointData;
    },
  ) {
    super({ x, y });
    this._mode = options?.mode;

    this.addChild(this._graphics);
    this._text = new Text({
      text: options?.text ?? "",
      anchor: options?.anchor ?? { x: 0.5, y: 0.5 },
      style: {
        fill: 0x000000,
        fontSize: 24,
        fontFamily: "Helvetica Neue Bold",
      },
    });
    this.addChild(this._text);

    this.renderBg();
  }

  setPos(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.renderBg();
  }

  setContent(text: string, mode: WordType | undefined) {
    this._text.text = text;
    this._mode = mode;
    this.renderBg();
  }

  private renderBg() {
    this._graphics.clear();
    if (this._text.text.length === 0) {
      return;
    }
    const color =
      this._mode === undefined ? theme.default : theme.wordTypes[this._mode];
    const pad: PointData = { x: 10, y: 5 };
    this._graphics
      .roundRect(
        this._text.x - this._text.width * this._text.anchor.x - pad.x,
        this._text.y - this._text.height * this._text.anchor.y - pad.y,
        this._text.width + pad.x * 2,
        this._text.height + pad.y * 2,
        10,
      )
      .fill({ color });
  }
}

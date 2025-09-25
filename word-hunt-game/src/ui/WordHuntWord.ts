import { Container, Graphics, type PointData, Text } from "pixi.js";
import type { WordType } from "../theme";
import theme from "../theme";

export default class WordHuntWord extends Container {
  private _mode: WordType | undefined = undefined;
  private readonly _text: Text;
  private readonly _graphics = new Graphics();

  constructor(x: number, y: number, text: string, mode: WordType | undefined) {
    super({ x, y });
    this._mode = mode;

    this.addChild(this._graphics);
    this._text = new Text({
      text: text,
      anchor: 0.5,
      style: {
        fill: 0x000000,
        fontSize: 24,
        fontFamily: "Helvetica Neue Bold",
      },
    });
    this.addChild(this._text);
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
        this._text.x - this._text.width * 0.5 - pad.x,
        this._text.y - this._text.height * 0.5 - pad.y,
        this._text.width + pad.x * 2,
        this._text.height + pad.y * 2,
        10,
      )
      .fill({ color });
  }
}

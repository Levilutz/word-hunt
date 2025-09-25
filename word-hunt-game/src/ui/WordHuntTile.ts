import { Container, Graphics, Text } from "pixi.js";

export default class WordHuntTile extends Container {
  private _w: number;
  private _pressed: boolean;
  private readonly _graphics: Graphics;
  private _text: Text;

  constructor(x: number, y: number, width: number, content: string) {
    super({ x, y });
    this._w = width;
    this._pressed = false;

    this._graphics = new Graphics();
    this.addChild(this._graphics);

    this._text = new Text({
      text: content,
      anchor: 0.5,
      style: {
        fill: 0x000000,
        fontSize: this._w * 0.8,
        fontFamily: "Helvetica",
      },
    });
    this.addChild(this._text);

    this.render();
  }

  setBounds(x: number, y: number, width: number) {
    this.x = x;
    this.y = y;
    this._w = width;

    this.render();
  }

  setPressed(pressed: boolean) {
    this._pressed = pressed;

    this.render();
  }

  private render() {
    const pop = this._pressed ? 0.025 * this._w : 0;
    this._graphics.clear();
    this._graphics
      .roundRect(
        -pop,
        -pop,
        this._w + 2 * pop,
        this._w + 2 * pop,
        this._w * 0.25,
      )
      .fill({ color: this._pressed ? 0xf8ead3 : 0xefcc92 });
    this._text.x = this._w * 0.5;
    this._text.y = this._w * 0.5;
    this._text.style.fontSize = this._w * 0.8;
  }
}

import { Container, Graphics, Text } from "pixi.js";
import theme, { type WordType } from "../theme";

export default class WordHuntTile extends Container {
  private _w: number;
  private _mode: WordType | undefined = undefined;
  private readonly _graphics = new Graphics();
  private readonly _text: Text;

  constructor(x: number, y: number, width: number, content: string) {
    super({ x, y });
    this._w = width;

    this.addChild(this._graphics);

    this._text = new Text({
      text: content,
      anchor: 0.5,
      style: {
        fill: 0x000000,
        fontSize: this._w * 0.7,
        fontFamily: "Helvetica Neue Bold",
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

  setMode(mode: WordType | undefined) {
    this._mode = mode;

    this.render();
  }

  private render() {
    const pop = this._mode !== undefined ? 0.025 * this._w : 0;
    this._graphics.clear();
    this._graphics
      .roundRect(
        -pop,
        -pop,
        this._w + 2 * pop,
        this._w + 2 * pop,
        this._w * 0.25,
      )
      .fill({
        color:
          this._mode !== undefined
            ? theme.wordTypes[this._mode]
            : theme.default,
      });
    this._text.x = this._w * 0.5;
    this._text.y = this._w * 0.5;
    this._text.style.fontSize = this._w * 0.7;
  }
}

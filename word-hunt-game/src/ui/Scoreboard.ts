import { Container, Graphics, Text } from "pixi.js";
import theme from "../theme";

const TOP_PAD = 10;

export default class Scoreboard extends Container {
  private _w: number;
  private _h: number;

  /** The background graphics. */
  private readonly _bg = new Graphics();

  /** Text representing the current points. */
  private readonly _pointsText: Text;

  /** Text representing the current number of words. */
  private readonly _numWordsText: Text;

  /** Text representing the timer. */
  private readonly _timerText: Text;

  constructor(x: number, y: number, width: number, height: number) {
    super({ x, y });
    this._w = width;
    this._h = height;

    this.addChild(this._bg);

    this._pointsText = new Text({
      x: 20,
      y: TOP_PAD,
      text: "10800",
      anchor: { x: 0, y: 0 },
      style: {
        align: "center",
        fontSize: 48,
        fontFamily: "Helvetica Neue Bold",
        lineHeight: 50,
      },
    });
    this.addChild(this._pointsText);

    this._numWordsText = new Text({
      x: 20,
      y: TOP_PAD + 48,
      text: "WORDS: 27",
      anchor: { x: 0, y: 0 },
      style: {
        align: "center",
        fontSize: 24,
        fontFamily: "Helvetica Neue Bold",
        lineHeight: 50,
      },
    });
    this.addChild(this._numWordsText);

    this._timerText = new Text({
      x: this._w - 20,
      y: TOP_PAD,
      text: "01:18",
      anchor: { x: 1, y: 0 },
      style: {
        align: "center",
        fontSize: 48,
        fontFamily: "Helvetica Neue Bold",
        lineHeight: 50,
      },
    });
    this.addChild(this._timerText);

    this.updateBg();
  }

  setBounds(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this._w = width;
    this._h = height;

    this._pointsText.x = 20;
    this._pointsText.y = TOP_PAD;

    this._numWordsText.x = 20;
    this._numWordsText.y = TOP_PAD + 48;

    this._timerText.x = this._w - 20;
    this._timerText.y = TOP_PAD;

    this.updateBg();
  }

  private updateBg() {
    this._bg.clear();
    this._bg
      .roundRect(0, 0, this._w, this._h, 10)
      .fill({ color: theme.wordTypes.invalid });
  }
}

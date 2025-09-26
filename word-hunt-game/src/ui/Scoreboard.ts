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

  /** Text representing the number of points from the last word. */
  private readonly _lastWordPointsText: Text;

  /** Text representing the timer. */
  private readonly _timerText: Text;

  constructor(x: number, y: number, width: number, height: number) {
    super({ x, y });
    this._w = width;
    this._h = height;

    this.addChild(this._bg);

    this._pointsText = new Text({
      x: this._w * 0.5,
      y: TOP_PAD,
      text: "POINTS\n4500\n18200",
      anchor: { x: 0.5, y: 0 },
      style: {
        align: "center",
        fontSize: 36,
        fontFamily: "Helvetica Neue Bold",
        lineHeight: 50,
      },
    });
    this.addChild(this._pointsText);

    this._numWordsText = new Text({
      x: this._w * 0.15,
      y: TOP_PAD,
      text: "WORDS\n21\n41",
      anchor: { x: 0.5, y: 0 },
      style: {
        align: "center",
        fontSize: 24,
        fontFamily: "Helvetica Neue Bold",
        lineHeight: 50,
      },
    });
    this.addChild(this._numWordsText);

    this._lastWordPointsText = new Text({
      x: this._w * 0.85,
      y: TOP_PAD,
      text: "LAST\n+400\n+2200",
      anchor: { x: 0.5, y: 0 },
      style: {
        align: "center",
        fontSize: 24,
        fontFamily: "Helvetica Neue Bold",
        lineHeight: 50,
      },
    });
    this.addChild(this._lastWordPointsText);

    this._timerText = new Text({
      x: this._w * 0.5,
      y: this._h - 10,
      text: "01:18",
      anchor: { x: 0.5, y: 1 },
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

    this._pointsText.x = this._w * 0.5;
    this._pointsText.y = TOP_PAD;

    this._numWordsText.x = this._w * 0.15;
    this._numWordsText.y = TOP_PAD;

    this._lastWordPointsText.x = this._w * 0.85;
    this._lastWordPointsText.y = TOP_PAD;

    this._timerText.x = this._w * 0.5;
    this._timerText.y = this._h - 10;

    this.updateBg();
  }

  private updateBg() {
    this._bg.clear();
    this._bg
      .rect(0, 0, this._w, this._h)
      .fill({ color: theme.wordTypes.invalid });
  }
}

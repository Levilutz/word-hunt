import { Container, Text } from "pixi.js";
import type Navigation from "../Navigation";
import type { AppScreen } from "../Navigation";
import type { AppState } from "../State";

export default class ResultScreen extends Container implements AppScreen {
  /** A reference to the global navigation instance. */
  private readonly _nav: Navigation;

  /** A reference to the global app state. */
  private readonly _appState: AppState;

  /** The width of the screen's area in Px. */
  private _w: number;

  /** The height of the screen's area in Px. */
  private _h: number;

  constructor(nav: Navigation, appState: AppState, w: number, h: number) {
    super();
    this._nav = nav;
    this._appState = appState;
    this._w = w;
    this._h = h;

    this.addChild(
      new Text({
        x: this._w / 2,
        y: this._h / 2,
        text: "Hello Results Page!",
        anchor: 0.5,
        style: {
          fill: 0x000000,
          fontSize: 24,
          fontFamily: "Helvetica Neue Bold",
        },
      }),
    );
  }

  resize(w: number, h: number) {
    this._w = w;
    this._h = h;
  }
}

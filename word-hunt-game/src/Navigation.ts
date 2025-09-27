import { Container, type Ticker } from "pixi.js";
import type { AppState } from "./State";
import HomeScreen from "./screens/HomeScreen";
import ResultScreen from "./screens/ResultScreen";

export interface AppScreen extends Container {
  update?: (time: Ticker) => void;
  resize?: (w: number, h: number) => void;
}

export default class Navigation extends Container {
  private appState: AppState;

  private _curScreen?: AppScreen;
  private _w: number;
  private _h: number;

  constructor(appState: AppState, w: number, h: number) {
    super();

    this.appState = appState;
    this._w = w;
    this._h = h;

    this.goToScreen(ResultScreen);
  }

  goToScreen(
    Ctor: new (
      nav: Navigation,
      appState: AppState,
      w: number,
      h: number,
    ) => AppScreen,
  ) {
    const screen = new Ctor(this, this.appState, this._w, this._h);
    if (this._curScreen !== undefined) {
      this.removeChild(this._curScreen);
      this._curScreen.destroy({ children: true });
    }
    this._curScreen = screen;
    this.addChild(this._curScreen);
    this._curScreen.resize?.(this._w, this._h);
  }

  resize(w: number, h: number) {
    this._w = w;
    this._h = h;
    this._curScreen?.resize?.(w, h);
  }
}

import { Container } from "pixi.js";
import DrawScreen from "./screens/DrawScreen";

export default class Navigation extends Container {
	private _curScreen: "draw" = "draw";
	private _drawScreen: DrawScreen = new DrawScreen();
	private _w: number = 100;
	private _h: number = 100;

	constructor(w: number, h: number) {
		super();

		this.addChild(this._drawScreen);

		this.resize(w, h);
	}

	resize(w: number, h: number) {
		this._w = w;
		this._h = h;
		this._drawScreen.resize(w, h);
	}
}

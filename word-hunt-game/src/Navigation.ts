import { Container, type Ticker } from "pixi.js";
import DrawScreen from "./screens/DrawScreen";

export interface AppScreen extends Container {
	update?: (time: Ticker) => void;
	resize?: (w: number, h: number) => void;
}

export default class Navigation extends Container {
	private _curScreen?: AppScreen;
	private _w: number;
	private _h: number;

	constructor(w: number, h: number) {
		super();

		this._w = w;
		this._h = h;

		this.goToScreen(new DrawScreen());
	}

	goToScreen(screen: AppScreen) {
		if (this._curScreen !== undefined) {
			this.removeChild(this._curScreen);
			this._curScreen.destroy();
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

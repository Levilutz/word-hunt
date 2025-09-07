import {
	Container,
	type FederatedPointerEvent,
	Graphics,
	Rectangle,
} from "pixi.js";

export default class DrawScreen extends Container {
	private readonly _graphics = new Graphics();
	private readonly _hitContainer = new Container();
	private readonly _hitArea = new Rectangle();

	private pointerDown = false;
	private path: { x: number; y: number }[] = [];

	constructor() {
		super();

		this.addChild(this._graphics);

		this._hitContainer.interactive = true;
		this._hitContainer.hitArea = this._hitArea;
		this.addChild(this._hitContainer);

		this._hitContainer.on("pointerup", this.handlePointerUp.bind(this));
		this._hitContainer.on("pointerdown", this.handlePointerDown.bind(this));
		this._hitContainer.on("pointermove", this.handlePointerMove.bind(this));
	}

	resize(w: number, h: number) {
		this._hitArea.width = w;
		this._hitArea.height = h;
	}

	private handlePointerUp(_event: FederatedPointerEvent) {
		this.pointerDown = false;
	}

	private handlePointerDown({ global }: FederatedPointerEvent) {
		this.pointerDown = true;
		const { x, y } = global;
		this.path = [{ x, y }];
		this.updateGraphics();
	}

	private handlePointerMove({ global }: FederatedPointerEvent) {
		if (this.pointerDown) {
			const { x, y } = global;
			this.path.push({ x, y });
			this.updateGraphics();
		}
	}

	private updateGraphics() {
		this._graphics.clear();
		if (this.path.length > 1) {
			this._graphics.moveTo(this.path[0].x, this.path[0].y);
			for (let i = 1; i < this.path.length; i++) {
				this._graphics.lineTo(this.path[i].x, this.path[i].y);
			}
			this._graphics.stroke({ width: 1, color: 0xff00ff });
		}
	}
}

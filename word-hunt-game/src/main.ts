import { Application, type FederatedPointerEvent, Graphics } from "pixi.js";
import "./style.css";

(async () => {
	const app = new Application();

	let pointerDown = false;
	let path: { x: number; y: number }[] = [];

	await app.init({ background: "#ffffff", resizeTo: window, antialias: true });

	document.body.appendChild(app.canvas);

	const graphics = new Graphics();

	const drawPath = () => {
		graphics.clear();
		if (path.length > 1) {
			graphics.moveTo(path[0].x, path[0].y);
			for (let i = 1; i < path.length; i++) {
				graphics.lineTo(path[i].x, path[i].y);
			}
			graphics.stroke({ width: 1, color: 0xff00ff });
		}
	};

	app.stage.addChild(graphics);

	app.stage.eventMode = "static";
	app.stage.hitArea = app.screen;

	app.stage.addEventListener(
		"pointerdown",
		({ global }: FederatedPointerEvent) => {
			pointerDown = true;
			const { x, y } = global;
			path = [{ x, y }];
			drawPath();
		},
	);

	app.stage.addEventListener("pointerup", (_e: FederatedPointerEvent) => {
		pointerDown = false;
	});

	app.stage.addEventListener(
		"pointermove",
		({ global }: FederatedPointerEvent) => {
			if (pointerDown) {
				const { x, y } = global;
				path.push({ x, y });
				drawPath();
			}
		},
	);
})();

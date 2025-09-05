import { useApplication, useExtend } from "@pixi/react";
import { Text } from "pixi.js";
import { useEffect, useState } from "react";

/** Container to manage arranging and sizing game components based on canvas size. */
export default function GameContainer() {
	useExtend({ Text });

	const { app } = useApplication();
	const [canvasSize, setCanvasSize] = useState({
		width: app.renderer.canvas.width,
		height: app.renderer.canvas.height,
	});

	useEffect(() => {
		const onResize = () => {
			setCanvasSize({
				width: app.renderer.canvas.width,
				height: app.renderer.canvas.height,
			});
		};
		app.renderer.on("resize", onResize);
		return () => {
			app.renderer.removeListener("resize", onResize);
		};
	}, [app]);

	return (
		<pixiText
			text={`${canvasSize.width} x ${canvasSize.height}`}
			anchor={0.5}
			x={50}
			y={50}
			style={{ fill: "white", fontSize: 24 }}
		/>
	);
}

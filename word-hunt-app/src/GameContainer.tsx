import { useApplication, useExtend } from "@pixi/react";
import { Text } from "pixi.js";
import { useEffect, useState } from "react";
import WordHuntGame from "./WordHuntGame";

export type GameContainerProps = {
	grid: (string | null)[][];
};

/** Container to manage arranging and sizing game components based on canvas size. */
export default function GameContainer({ grid }: GameContainerProps) {
	useExtend({ Text });

	const { app } = useApplication();
	const [canvasSize, setCanvasSize] = useState({
		width: app.renderer?.canvas?.width ?? 100,
		height: app.renderer?.canvas?.height ?? 100,
	});

	useEffect(() => {
		const onResize = (width: number, height: number) => {
			setCanvasSize({ width, height });
		};
		app.renderer.on("resize", onResize);
		return () => {
			app.renderer.removeListener("resize", onResize);
		};
	}, [app]);

	return (
		<WordHuntGame
			width={canvasSize.width}
			height={canvasSize.height}
			grid={grid}
			checkWord={(word) => {
				if (word.length > 2) {
					return "valid";
				} else if (word.length === 2) {
					return "used";
				} else {
					return "invalid";
				}
			}}
			onWordSubmit={(word) => console.log(word)}
		/>
	);
}

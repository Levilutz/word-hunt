import { useExtend } from "@pixi/react";
import { Container, type FederatedPointerEvent, Graphics } from "pixi.js";
import { useState } from "react";

export type PointerCurveProps = {
	width: number;
	height: number;
};

export default function PointerCurve({ width, height }: PointerCurveProps) {
	useExtend({ Graphics, Container });
	const [curPath, setCurPath] = useState<{ x: number; y: number }[]>([]);
	const [pointerDown, setPointerDown] = useState(false);

	return (
		<pixiContainer
			x={0}
			y={0}
			width={width}
			height={height}
			eventMode="static"
			cursor="pointer"
			onPointerDown={({ global }: FederatedPointerEvent) => {
				const { x, y } = global;
				setPointerDown(true);
				setCurPath([{ x, y }]);
			}}
			onPointerUp={() => {
				console.log(curPath.length);
				setPointerDown(false);
			}}
			onPointerMove={({ global }: FederatedPointerEvent) => {
				if (pointerDown) {
					const { x, y } = global;
					setCurPath([...curPath, { x, y }]);
				}
			}}
		>
			<pixiGraphics
				draw={(graphics) => {
					graphics.rect(0, 0, width, height).fill({ color: "0xffffff" });
					if (curPath !== null && curPath.length > 0) {
						graphics.moveTo(curPath[0].x, curPath[0].y);
						for (let i = 1; i < curPath.length; i++) {
							graphics.lineTo(curPath[i].x, curPath[i].y);
						}
						graphics.stroke({
							width: 1,
							color: 0xff00ff,
							cap: "round",
							join: "round",
						});
					}
				}}
			/>
		</pixiContainer>
	);
}

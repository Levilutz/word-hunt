/** biome-ignore-all lint/a11y/noStaticElementInteractions: HTML5 Canvas Interactivity */

import { useExtend } from "@pixi/react";
import {
	Assets,
	Container,
	type FederatedPointerEvent,
	Graphics,
	Sprite,
	Text,
	Texture,
} from "pixi.js";
import { useEffect, useRef, useState } from "react";
import hardwood from "./assets/hardwood.jpg";

const borderRadius = 0.25;

export type WordHuntTileProps = {
	x: number;
	y: number;
	tileSize: number;
	contents: string;
	showHover: boolean;
	onClick?: () => void;
	onEnterClose?: () => void;
};

export default function WordHuntTile({
	x,
	y,
	tileSize,
	contents,
	showHover,
	onClick,
	onEnterClose,
}: WordHuntTileProps) {
	useExtend({ Sprite, Graphics, Text, Container });
	const maskRef = useRef<Graphics>(null);
	const [hardwoodTexture, setHardwoodTexture] = useState(Texture.EMPTY);
	const [buttonHover, setButtonHover] = useState(false);
	const [buttonClick, setButtonClick] = useState(false);

	useEffect(() => {
		if (hardwoodTexture === Texture.EMPTY) {
			Assets.load(hardwood).then((res) => setHardwoodTexture(res));
		}
	}, [hardwoodTexture]);

	return (
		<pixiContainer
			x={x}
			y={y}
			width={tileSize}
			height={tileSize}
			eventMode="static"
			cursor="pointer"
			onPointerEnter={() => setButtonHover(true)}
			onPointerLeave={() => {
				setButtonHover(false);
				setButtonClick(false);
			}}
			onPointerDown={() => {
				setButtonClick(true);
				onClick?.();
			}}
			onPointerUp={() => setButtonClick(false)}
			onPointerMove={({ global }: FederatedPointerEvent) => {
				const { x: globalX, y: globalY } = global;
				const r = tileSize * 0.5;
				const xDist = Math.abs(x + r - globalX);
				const yDist = Math.abs(y + r - globalY);
				const dist2 = xDist * xDist + yDist * yDist;
				if (dist2 <= r * r) {
					onEnterClose?.();
				}
			}}
			alpha={buttonClick ? 0.8 : 1}
			mask={maskRef?.current}
		>
			<pixiGraphics
				ref={maskRef}
				draw={(graphics) => {
					graphics
						.roundRect(0, 0, tileSize, tileSize, tileSize * borderRadius)
						.fill({ color: 0xffffff });
				}}
			/>
			<pixiSprite
				x={0}
				y={0}
				width={tileSize}
				height={tileSize}
				texture={hardwoodTexture}
			/>
			<pixiText
				text={contents}
				anchor={0.5}
				x={tileSize * 0.5}
				y={tileSize * 0.5}
				style={{
					fill: "black",
					fontSize: tileSize * 0.8,
					fontFamily: "Helvetica Neue Bold",
					dropShadow: {
						alpha: 1,
						angle: Math.PI / 2,
						blur: 1,
						color: "#ffffff",
						distance: 1,
					},
				}}
				resolution={2}
				alpha={0.6}
			/>
			{showHover && buttonHover && (
				<pixiGraphics
					draw={(graphics) => {
						graphics
							.roundRect(0, 0, tileSize, tileSize, tileSize * borderRadius)
							.stroke({ width: 6, color: 0xfff1b3 });
					}}
				/>
			)}
		</pixiContainer>
	);
}

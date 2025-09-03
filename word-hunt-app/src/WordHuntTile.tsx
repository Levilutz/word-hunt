/** biome-ignore-all lint/a11y/noStaticElementInteractions: HTML5 Canvas Interactivity */

import { useExtend } from "@pixi/react";
import { Assets, Container, Graphics, Sprite, Text, Texture } from "pixi.js";
import { useEffect, useRef, useState } from "react";
import hardwood from "./assets/hardwood.jpg";

export type WordHuntTileProps = {
	x: number;
	y: number;
	contents: string;
};

export default function WordHuntTile({ x, y, contents }: WordHuntTileProps) {
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
			width={90}
			height={90}
			eventMode="static"
			cursor="pointer"
			onPointerEnter={() => setButtonHover(true)}
			onPointerLeave={() => {
				setButtonHover(false);
				setButtonClick(false);
			}}
			onPointerDown={() => setButtonClick(true)}
			onPointerUp={() => setButtonClick(false)}
			alpha={buttonClick ? 0.4 : buttonHover ? 0.8 : 1}
			mask={maskRef?.current}
		>
			<pixiGraphics
				ref={maskRef}
				draw={(graphics) => {
					graphics.roundRect(0, 0, 90, 90, 9).fill({ color: 0xffffff });
				}}
			/>
			<pixiSprite
				x={0}
				y={0}
				width={90}
				height={90}
				texture={hardwoodTexture}
			/>
			<pixiText
				text={contents}
				anchor={0.5}
				x={45}
				y={45}
				style={{ fill: "white", fontSize: 90 * 0.8 }}
			/>
		</pixiContainer>
	);
}

/** biome-ignore-all lint/a11y/noStaticElementInteractions: HTML5 Canvas Interactivity */

import { Application, useExtend } from "@pixi/react";
import {
	Assets,
	Container,
	Graphics,
	Sprite,
	Text,
	Texture,
	TilingSprite,
} from "pixi.js";
import { useEffect, useRef, useState } from "react";
import grass from "./assets/grass.png";
import hardwood from "./assets/hardwood.jpg";

export type WordHuntTileProps = {
	contents: string;
};

export default function WordHuntTile({ contents }: WordHuntTileProps) {
	useExtend({ Sprite, Graphics, Text, TilingSprite, Container });
	const maskRef = useRef<Graphics>(null);
	const [hardwoodTexture, setHardwoodTexture] = useState(Texture.EMPTY);
	const [grassTexture, setGrassTexture] = useState(Texture.EMPTY);
	const [buttonHover, setButtonHover] = useState(false);
	const [buttonClick, setButtonClick] = useState(false);

	useEffect(() => {
		if (hardwoodTexture === Texture.EMPTY) {
			Assets.load(hardwood).then((res) => setHardwoodTexture(res));
		}
		if (grassTexture === Texture.EMPTY) {
			Assets.load(grass).then((res) => setGrassTexture(res));
		}
	}, [hardwoodTexture, grassTexture]);

	return (
		<Application width={405} height={405}>
			<pixiTilingSprite
				x={0}
				y={0}
				width={405}
				height={405}
				tileScale={{ x: 0.1, y: 0.1 }}
				texture={grassTexture}
			/>
			<pixiContainer
				x={9}
				y={9}
				width={90}
				height={90}
				eventMode="static"
				cursor="pointer"
				onMouseEnter={() => setButtonHover(true)}
				onMouseLeave={() => setButtonHover(false)}
				onMouseDown={() => setButtonClick(true)}
				onMouseUp={() => setButtonClick(false)}
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
		</Application>
	);
}

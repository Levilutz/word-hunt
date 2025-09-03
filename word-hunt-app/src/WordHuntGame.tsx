/** biome-ignore-all lint/a11y/noStaticElementInteractions: HTML5 Canvas Interactivity */

import { Application, useExtend } from "@pixi/react";
import { Assets, Texture, TilingSprite } from "pixi.js";
import { useEffect, useState } from "react";
import grass from "./assets/grass.png";
import WordHuntTile from "./WordHuntTile";

export type WordHuntGameProps = {
	width: number;
	height: number;
	grid: (string | null)[][];
};

export default function WordHuntGame({
	width,
	height,
	// grid,
}: WordHuntGameProps) {
	useExtend({ TilingSprite });
	const [textureGrass, setTextureGrass] = useState(Texture.EMPTY);

	useEffect(() => {
		if (textureGrass === Texture.EMPTY) {
			Assets.load(grass).then((res) => setTextureGrass(res));
		}
	}, [textureGrass]);

	return (
		<Application width={width} height={height}>
			<pixiTilingSprite
				x={0}
				y={0}
				width={405}
				height={405}
				tileScale={{ x: 0.1, y: 0.1 }}
				texture={textureGrass}
			/>
			<WordHuntTile contents="A" />
		</Application>
	);
}

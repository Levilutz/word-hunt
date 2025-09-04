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
	grid,
}: WordHuntGameProps) {
	useExtend({ TilingSprite });
	const [textureGrass, setTextureGrass] = useState(Texture.EMPTY);

	useEffect(() => {
		if (textureGrass === Texture.EMPTY) {
			Assets.load(grass).then((res) => setTextureGrass(res));
		}
	}, [textureGrass]);

	const { gridWidth } = gridSize(grid);

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
			{grid.flatMap((row, y) =>
				row.map((contents, x) =>
					contents !== null ? (
						<WordHuntTile
							// biome-ignore lint/suspicious/noArrayIndexKey: Order is stable
							key={y * gridWidth + x * 1}
							x={99 * x + 9}
							y={99 * y + 9}
							contents={contents}
							showHover
						/>
					) : null,
				),
			)}
		</Application>
	);
}

function gridSize(grid: (string | null)[][]): {
	gridWidth: number;
	gridHeight: number;
} {
	return {
		gridWidth: grid.length > 0 ? Math.max(...grid.map((row) => row.length)) : 0,
		gridHeight: grid.length,
	};
}

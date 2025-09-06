/** biome-ignore-all lint/a11y/noStaticElementInteractions: HTML5 Canvas Interactivity */

import { useExtend } from "@pixi/react";
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
	const usedWidth = Math.min(width, height) * 0.75;
	const { tilePx, spacePx } = getTileAndSpacePx(usedWidth, gridWidth, 0.15);
	const hPad = (width - usedWidth) * 0.5;
	const vPad = (height - usedWidth) * 0.5;

	return (
		<>
			<pixiTilingSprite
				x={0}
				y={0}
				width={width}
				height={height}
				tileScale={{ x: 0.1, y: 0.1 }}
				texture={textureGrass}
			/>
			{grid.flatMap((row, y) =>
				row.map((contents, x) =>
					contents !== null ? (
						<WordHuntTile
							// biome-ignore lint/suspicious/noArrayIndexKey: Order is stable
							key={y * gridWidth + x}
							x={(tilePx + spacePx) * x + spacePx + hPad}
							y={(tilePx + spacePx) * y + spacePx + vPad}
							tileSize={tilePx}
							contents={contents}
							showHover
						/>
					) : null,
				),
			)}
		</>
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

function getTileAndSpacePx(
	pixels: number,
	tiles: number,
	spaceRatio: number,
): { tilePx: number; spacePx: number } {
	const relativeTiles = tiles + spaceRatio * (tiles + 1);
	const tilePx = pixels / relativeTiles;
	const spacePx = tilePx * spaceRatio;
	return { tilePx, spacePx };
}

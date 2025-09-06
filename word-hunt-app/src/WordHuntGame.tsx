/** biome-ignore-all lint/a11y/noStaticElementInteractions: HTML5 Canvas Interactivity */

import { useExtend } from "@pixi/react";
import { Assets, Texture, TilingSprite } from "pixi.js";
import { useEffect, useState } from "react";
import grass from "./assets/grass.png";
import WordHuntTile from "./WordHuntTile";

type Point = { x: number; y: number };
type Path = Point[];

export type WordHuntGameProps = {
	width: number;
	height: number;
	grid: (string | null)[][];
	checkWord: (word: string) => "valid" | "invalid" | "used";
	onWordSubmit?: (word: string) => void;
};

export default function WordHuntGame({
	width,
	height,
	grid,
	checkWord,
	onWordSubmit,
}: WordHuntGameProps) {
	useExtend({ TilingSprite });
	const [textureGrass, setTextureGrass] = useState(Texture.EMPTY);
	const [curPath, setCurPath] = useState<Path | null>(null);

	useEffect(() => {
		const handlePointerUp = () => {
			if (curPath !== null && curPath.length > 0) {
				const word = extractWord(grid, curPath);
				if (word !== null) {
					onWordSubmit?.(word);
				}
			}
			setCurPath(null);
		};
		window.addEventListener("pointerup", handlePointerUp);
		return () => {
			window.removeEventListener("pointerup", handlePointerUp);
		};
	}, [grid, curPath, onWordSubmit]);

	useEffect(() => {
		if (textureGrass === Texture.EMPTY) {
			Assets.load(grass).then((res) => setTextureGrass(res));
		}
	}, [textureGrass]);

	const { gridWidth } = gridSize(grid);
	const usedWidth = Math.min(width, height) * 0.75;
	const { tilePx, spacePx } = getTileAndSpacePx(usedWidth, gridWidth, 0.1);
	const hPad = (width - usedWidth) * 0.5;
	const vPad = (height - usedWidth) * 0.5;

	const wordStatus = checkWordStatus(grid, curPath, checkWord);

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
							showHover={curPath === null}
							tint={
								curPath !== null && pathContainsPoint(curPath, { x, y })
									? wordStatus
									: undefined
							}
							onClick={() => {
								if (curPath === null) {
									setCurPath([{ x, y }]);
								}
							}}
							onEnterClose={() => {
								// Check all conditions before adding this to path
								// Can't add to path if no path started
								if (curPath === null || curPath.length === 0) {
									return;
								}
								// Can't add to path if already in path
								if (pathContainsPoint(curPath, { x, y })) {
									return;
								}
								// Can't add to path if not adjacent to last tile
								if (!pointsAdjacent(curPath[curPath.length - 1], { x, y })) {
									return;
								}
								// All conditions passed, add to path
								setCurPath((path) => [...(path ?? []), { x, y }]);
							}}
						/>
					) : null,
				),
			)}
			{curPath !== null && curPath.length > 0 && (
				<pixiGraphics
					draw={(graphics) => {
						const color =
							wordStatus === "valid" || wordStatus === "used"
								? 0xffffff
								: 0xff0000;
						for (let i = 0; i < curPath.length; i++) {
							const displayX =
								(tilePx + spacePx) * (curPath[i].x + 0.5) + spacePx + hPad;
							const displayY =
								(tilePx + spacePx) * (curPath[i].y + 0.5) + spacePx + vPad;
							if (i > 0) {
								graphics.lineTo(displayX, displayY).stroke({
									width: tilePx * 0.1,
									color,
								});
							}
							graphics
								.circle(displayX, displayY, tilePx * 0.05)
								.fill({ color });
							graphics.moveTo(displayX, displayY);
						}
						graphics.closePath();
					}}
				/>
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

function extractWord(grid: (string | null)[][], path: Path): string | null {
	let out = "";
	for (const { x, y } of path) {
		if (grid?.[y]?.[x] == null) {
			return null;
		}
		out += grid[y][x];
	}
	return out;
}

function checkWordStatus(
	grid: (string | null)[][],
	path: Path | null,
	checkWord: (word: string) => "valid" | "invalid" | "used",
): "valid" | "invalid" | "used" | undefined {
	if (path === null) {
		return undefined;
	}
	const word = extractWord(grid, path);
	if (word === null) {
		return undefined;
	}
	return checkWord(word);
}

function pointsEqual(p1: Point, p2: Point): boolean {
	return p1.x === p2.x && p1.y === p2.y;
}

function pointsAdjacent(p1: Point, p2: Point): boolean {
	if (pointsEqual(p1, p2)) {
		return false;
	}
	return Math.abs(p1.x - p2.x) <= 1 && Math.abs(p1.y - p2.y) <= 1;
}

function pathContainsPoint(path: Path, point: Point): boolean {
	return path.some((p) => pointsEqual(p, point));
}

import { useCallback, useEffect, useRef } from "react";

type Highlight = "none" | "hover" | "selected" | "new-word" | "used-word";

const highlightColor: Record<Highlight, string> = {
	none: "grey",
	hover: "blue",
	selected: "purple",
	"new-word": "green",
	"used-word": "yellow",
};

export type WordHuntTile = {
	/** What character is contained in this tile */
	contents: string;

	/** How is the tile highlighted */
	highlight: Highlight;
};

export type WordHuntProps = {
	/** The width of the canvas in px. */
	width: number;

	/** The height of the canvas in px. */
	height: number;

	/** The grid of tiles to render */
	grid: (WordHuntTile | null)[][];

	/** A path to render over the tiles. If empty, none is rendered */
	path: { x: number; y: number }[];

	/** A callback for when the user initiates a path by clicking. */
	onPathStart: (x: number, y: number) => void;

	/** A callback for when the user hovers over a tile.
	 *
	 * May indicate them just hovering if no path is in-progress, or adding a new tile to
	 * the current path if one is in-progress.
	 *
	 * May be called with empty tiles, caller should check.
	 * May be called many times for a single tile, caller should check.
	 */
	onTileHover: (x: number, y: number) => void;

	/** A callback for when the user completes their path by releasing the mouse.
	 *
	 * May be called when no path is in-progress, caller should check.
	 */
	onPathFinish: () => void;
};

export default function WordHunt({
	width,
	height,
	grid,
	path,
	onPathStart,
	onTileHover,
	onPathFinish,
}: WordHuntProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const onMouseMove = useCallback(
		(ev: MouseEvent) => {
			const { gridWidth, gridHeight } = gridSize(grid);
			const { tilePx: widthTilePx, spacePx: widthSpacePx } = getTileAndSpacePx(
				width,
				gridWidth,
				0.1,
			);
			const { tilePx: heightTilePx, spacePx: heightSpacePx } =
				getTileAndSpacePx(height, gridHeight, 0.1);
			console.log(ev.x, ev.y);
			onTileHover(widthTilePx + widthSpacePx, heightTilePx + heightSpacePx);
		},
		[grid, width, height, onTileHover],
	);

	const onMouseDown = useCallback(
		(ev: MouseEvent) => {
			onPathStart(ev.x, ev.y);
		},
		[onPathStart],
	);

	const onMouseUp = useCallback(() => {
		onPathFinish();
	}, [onPathFinish]);

	// Mount event listener
	useEffect(() => {
		const canvas = canvasRef.current;
		if (canvas === null) {
			console.log("Unable to mount event listeners to canvas");
			return;
		}
		canvas.addEventListener("mousemove", onMouseMove);
		canvas.addEventListener("mousedown", onMouseDown);
		document.addEventListener("mouseup", onMouseUp);
		return () => {
			canvas.removeEventListener("mousemove", onMouseMove);
			canvas.removeEventListener("mousedown", onMouseDown);
			document.removeEventListener("mouseup", onMouseUp);
		};
	}, [onMouseMove, onMouseDown, onMouseUp]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (canvas === null) {
			return;
		}
		const ctx = canvasRef.current?.getContext("2d");
		if (ctx == null) {
			return;
		}
		const { gridWidth, gridHeight } = gridSize(grid);
		const { tilePx: widthTilePx, spacePx: widthSpacePx } = getTileAndSpacePx(
			width,
			gridWidth,
			0.1,
		);
		const { tilePx: heightTilePx, spacePx: heightSpacePx } = getTileAndSpacePx(
			height,
			gridHeight,
			0.1,
		);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.font = `${heightTilePx * 0.8}px Arial`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		for (let y = 0; y < gridHeight; y++) {
			for (let x = 0; x < gridWidth; x++) {
				const tile = grid[y]?.[x];
				if (tile != null) {
					ctx.fillStyle = highlightColor[tile.highlight];
					const startX = (widthTilePx + widthSpacePx) * x;
					const startY = (heightTilePx + heightSpacePx) * y;
					ctx.fillRect(startX, startY, widthTilePx, heightTilePx);
					ctx.fillStyle = "black";
					ctx.fillText(
						tile.contents,
						startX + widthTilePx / 2,
						startY + heightTilePx / 2,
					);
				}
			}
		}
		const pathLen = path.length;
		if (pathLen > 2) {
			ctx.beginPath();
			ctx.lineWidth = 5;
			ctx.strokeStyle = "red";
			for (let i = 0; i < pathLen - 1; i++) {
				const { x: startX, y: startY } = path[i];
				const { x: endX, y: endY } = path[i + 1];
				const startXPos =
					(widthTilePx + widthSpacePx) * startX + widthTilePx / 2;
				const startYPos =
					(heightTilePx + heightSpacePx) * startY + heightTilePx / 2;
				const endXPos = (widthTilePx + widthSpacePx) * endX + widthTilePx / 2;
				const endYPos =
					(heightTilePx + heightSpacePx) * endY + heightTilePx / 2;
				ctx.moveTo(startXPos, startYPos);
				ctx.lineTo(endXPos, endYPos);
				ctx.stroke();
			}
		}
	}, [width, height, grid, path]);

	return <canvas ref={canvasRef} width={width} height={height} />;
}

function gridSize(grid: (WordHuntTile | null)[][]): {
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

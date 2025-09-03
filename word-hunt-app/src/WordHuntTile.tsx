import { Application, useExtend } from "@pixi/react";
import { Assets, Sprite, Texture } from "pixi.js";
import { useEffect, useState } from "react";

export type WordHuntTileProps = {
	contents: string;
};

export default function WordHuntTile({ contents }: WordHuntTileProps) {
	useExtend({ Sprite });
	const [texture, setTexture] = useState(Texture.EMPTY);
	useEffect(() => {
		if (texture === Texture.EMPTY) {
			Assets.load("https://pixijs.com/assets/bunny.png").then((res) =>
				setTexture(res),
			);
		}
	});
	return (
		<Application>
			<pixiSprite x={50} y={50} texture={texture} />
		</Application>
	);
}

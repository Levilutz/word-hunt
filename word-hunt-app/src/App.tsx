import { Application } from "@pixi/react";
import WordHuntGame from "./WordHuntGame";
import GameContainer from "./GameContainer";

function App() {
	return (
		<Application resizeTo={window} antialias>
			<GameContainer></GameContainer>
		</Application>
		// <WordHuntGame
		// 	grid={[
		// 		["A", "B", "C", "D"],
		// 		["E", "F", "G", "H"],
		// 		["I", "J", "K", "L"],
		// 		["M", "N", "O", "P"],
		// 	]}
		// />
		// <WordHunt
		// 	width={405}
		// 	height={405}
		// 	grid={[
		// 		[
		// 			{ contents: "A", highlight: "none" },
		// 			{ contents: "B", highlight: "none" },
		// 			{ contents: "C", highlight: "none" },
		// 			{ contents: "D", highlight: "none" },
		// 		],
		// 		[
		// 			{ contents: "D", highlight: "hover" },
		// 			{ contents: "E", highlight: "selected" },
		// 			{ contents: "F", highlight: "new-word" },
		// 			{ contents: "G", highlight: "used-word" },
		// 		],
		// 		[
		// 			{ contents: "H", highlight: "hover" },
		// 			{ contents: "I", highlight: "selected" },
		// 			{ contents: "J", highlight: "new-word" },
		// 			{ contents: "K", highlight: "used-word" },
		// 		],
		// 		[
		// 			{ contents: "L", highlight: "none" },
		// 			{ contents: "M", highlight: "none" },
		// 			{ contents: "N", highlight: "none" },
		// 			{ contents: "O", highlight: "none" },
		// 		],
		// 	]}
		// 	path={[
		// 		{ x: 0, y: 0 },
		// 		{ x: 1, y: 1 },
		// 		{ x: 1, y: 2 },
		// 		{ x: 0, y: 3 },
		// 	]}
		// 	onPathStart={() => {}}
		// 	onPathFinish={() => {}}
		// 	onTileHover={() => {}}
		// />
	);
}

export default App;

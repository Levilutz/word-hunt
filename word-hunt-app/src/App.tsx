import { Application } from "@pixi/react";
import GameContainer from "./GameContainer";
import { useEffect, useState } from "react";

function App() {
	// Let the application exist for a few frames before starting the game
	// Otherwise we get issues with the resize handler in GameContainer failing to mount
	const [showGame, setShowGame] = useState(false);
	useEffect(() => {
		const timer = setTimeout(() => {
			setShowGame(true);
		}, 5);
		return () => clearTimeout(timer);
	}, []);

	return (
		<Application resizeTo={window} antialias>
			{showGame && (
				<GameContainer
					grid={[
						["A", "B", "C", "D"],
						["E", "F", "G", "H"],
						["I", "J", "K", "L"],
						["M", "N", "O", "P"],
					]}
				/>
			)}
		</Application>
	);
}

export default App;

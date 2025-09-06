import { Application } from "@pixi/react";
import GameContainer from "./GameContainer";

function App() {
	return (
		<Application resizeTo={window} antialias>
			<GameContainer
				grid={[
					["A", "B", "C", "D"],
					["E", "F", "G", "H"],
					["I", "J", "K", "L"],
					["M", "N", "O", "P"],
				]}
			/>
		</Application>
	);
}

export default App;

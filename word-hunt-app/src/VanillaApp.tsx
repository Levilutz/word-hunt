import { Application } from "pixi.js";
import initGame from "./word-hunt";

export default function VanillaApp() {
	return (
		<div
			ref={(node) => {
				// Create the app
				const app = new Application();

				// Trackers for mount & unmount
				let mounted = false;
				let mustUnmount = false;

				// Game cleanup fn
				let cleanupGame: () => void = () => {};

				// Kick off asnyc app init & mount
				(async () => {
					// Init & mount app
					await app.init({
						background: "#ffffff",
						resizeTo: window,
						antialias: true,
					});
					node?.appendChild(app.canvas);
					mounted = true;

					// Yield to event loop for a moment to see if unmount came while init-ing
					await new Promise((res) => setTimeout(res, 5));
					if (mustUnmount) {
						return;
					}

					// Initialize game and get cleanup fn
					// NOTE: If this must be made async, new concurrency scenarios have to be
					// considered in the cleanup fn
					cleanupGame = initGame(app);
				})();

				// Return cleanup fn
				return () => {
					mustUnmount = true;

					// Kick off asnyc app unmount & destroy
					(async () => {
						// If mount async fn hasn't finished yet, give it time to before unmounting
						if (!mounted) {
							for (let i = 0; i < 100; i++) {
								await new Promise((res) => setTimeout(res, 5));
								if (mounted) {
									break;
								}
							}
						}

						// Run game cleanup fn
						cleanupGame();

						// Unmount & destroy app
						node?.removeChild(app.canvas);
						app.destroy(true);
					})();
				};
			}}
		></div>
	);
}

import { Application } from "pixi.js";
import "./style.css";
import { Trie } from "./core/trie";
import Navigation from "./Navigation";
import type { AppState } from "./State";

(async () => {
  const app = new Application();

  await app.init({
    background: "#ffffff",
    resizeTo: window,
    antialias: true,
    resolution: Math.max(window.devicePixelRatio, 2),
  });

  const appState: AppState = {
    trie: new Trie(["A", "ABC", "ABCH", "ABCHG"]),
    grid: [
      ["A", "B", "C", "D"],
      ["E", "F", "G", "H"],
      ["I", "J", "K", "L"],
      ["M", "N", "O", "P"],
    ],
  };

  app.renderer.canvas.style.width = `${window.innerWidth}px`;
  app.renderer.canvas.style.height = `${window.innerHeight}px`;

  document.body.appendChild(app.canvas);

  const navigation = new Navigation(
    appState,
    window.innerWidth,
    window.innerHeight,
  );

  app.stage.addChild(navigation);

  app.renderer.on("resize", (w, h) => {
    navigation.resize(w, h);
    app.renderer.canvas.style.width = `${w}px`;
    app.renderer.canvas.style.height = `${h}px`;
  });
})();

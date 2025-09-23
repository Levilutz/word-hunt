import { Application } from "pixi.js";
import "./style.css";
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
    // grid: [
    //   ["A", "B", "C", "D"],
    //   ["E", "F", "G", "H"],
    //   ["I", "J", "K", "L"],
    //   ["M", "N", "O", "P"],
    // ],
    grid: [
      ["A", "B", "C", "D", "X", "X", "X", "X"],
      ["E", "F", "G", "H", "X", "X", "X", "X"],
      ["I", "J", "K", "L", "X", "X", "X", "X"],
      ["M", "N", "O", "P", "X", "X", "X", "X"],
      ["A", "B", "C", "D", "X", "X", "X", "X"],
      ["E", "F", "G", "H", "X", "X", "X", "X"],
      ["I", "J", "K", "L", "X", "X", "X", "X"],
      ["M", "N", "O", "P", "X", "X", "X", "X"],
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

import { Application } from "pixi.js";
import "./style.css";
import Navigation from "./Navigation";

(async () => {
  const app = new Application();

  await app.init({
    background: "#ffffff",
    resizeTo: window,
    antialias: true,
    resolution: Math.max(window.devicePixelRatio, 2),
  });

  app.renderer.canvas.style.width = `${window.innerWidth}px`;
  app.renderer.canvas.style.height = `${window.innerHeight}px`;

  document.body.appendChild(app.canvas);

  const navigation = new Navigation(window.innerWidth, window.innerHeight);

  app.stage.addChild(navigation);

  app.renderer.on("resize", (w, h) => {
    navigation.resize(w, h);
    app.renderer.canvas.style.width = `${w}px`;
    app.renderer.canvas.style.height = `${h}px`;
  });
})();

import { Application, Assets } from "pixi.js";
import "./style.css";
import HelveticaNeueBold from "./assets/HelveticaNeue-Bold.otf";
import dud from "./assets/dud.ogg";
import { Trie } from "./core/trie";
import Navigation from "./Navigation";
import type { AppState } from "./State";
import { sound } from "@pixi/sound";

(async () => {
  await Assets.load(HelveticaNeueBold);
  sound.add("dud", dud);

  const app = new Application();

  await app.init({
    background: "#ffffff",
    resizeTo: window,
    antialias: true,
    resolution: Math.max(window.devicePixelRatio, 2),
  });

  const appState: AppState = {
    trie: new Trie([
      "CHLONK",
      "KNIFE",
      "PLONK",
      "FINK",
      "FINO",
      "GLOP",
      "JINK",
      "KOJI",
      "KNOP",
      "MINK",
      "FAB",
      "FIE",
      "FIN",
      "INK",
      "JIN",
      "KOP",
      "LOP",
      "NIM",
      "POL",
    ]),
    grid: [
      ["A", "B", "C", "D"],
      ["E", "F", "G", "H"],
      ["I", "J", "K", "L"],
      ["M", "N", "O", "P"],
    ],
    submittedWords: [],
    score: 0,
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

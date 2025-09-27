import { Application, Assets } from "pixi.js";
import "./style.css";
import { sound } from "@pixi/sound";
import click from "./assets/bell72.ogg";
import HelveticaNeueBold from "./assets/HelveticaNeue-Bold.otf";
import trill1 from "./assets/trill1.ogg";
import trill2 from "./assets/trill2.ogg";
import trill3 from "./assets/trill3.ogg";
import trill4 from "./assets/trill4.ogg";
import trill5 from "./assets/trill5.ogg";
import trill6 from "./assets/trill6.ogg";
import { Trie } from "./core/trie";
import Navigation from "./Navigation";
import type { AppState } from "./State";

(async () => {
  await Assets.load(HelveticaNeueBold);
  sound.add("click", click);
  sound.add("trill1", trill1);
  sound.add("trill2", trill2);
  sound.add("trill3", trill3);
  sound.add("trill4", trill4);
  sound.add("trill5", trill5);
  sound.add("trill6", trill6);

  const playAudio = () => {
    sound.play("click", { volume: 0 });
    document.removeEventListener("pointerdown", playAudio);
  };
  document.addEventListener("pointerdown", playAudio);

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

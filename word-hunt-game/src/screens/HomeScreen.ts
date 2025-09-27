import { sound } from "@pixi/sound";
import { Container } from "pixi.js";
import { Trie } from "../core/trie";
import type Navigation from "../Navigation";
import type { AppScreen } from "../Navigation";
import type { AppState } from "../State";
import Button from "../ui/Button";
import WordHuntScreen from "./WordHuntScreen";

export default class HomeScreen extends Container implements AppScreen {
  /** A reference to the global navigation instance. */
  private readonly _nav: Navigation;

  /** A reference to the global app state. */
  private readonly _appState: AppState;

  /** The width of the screen's area in Px. */
  private _w: number;

  /** The height of the screen's area in Px. */
  private _h: number;

  private _startButton: Button;

  constructor(nav: Navigation, appState: AppState, w: number, h: number) {
    super();
    this._nav = nav;
    this._appState = appState;
    this._w = w;
    this._h = h;
    this._startButton = new Button(
      this._w / 2,
      this._h / 2,
      "START",
      this.handleStartPress.bind(this),
      this.handleStartRelease.bind(this),
    );
    this.addChild(this._startButton);
  }

  resize(w: number, h: number) {
    this._w = w;
    this._h = h;
    this._startButton.setPos(this._w / 2, this._h / 2);
  }

  private handleStartPress() {
    sound.play("click");
  }

  private handleStartRelease() {
    this._appState.trie = new Trie([
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
    ]);
    this._appState.grid = [
      ["A", "B", "C", "D"],
      ["E", "F", "G", "H"],
      ["I", "J", "K", "L"],
      ["M", "N", "O", "P"],
    ];
    this._appState.submittedWords = [];
    this._appState.score = 0;
    this._appState.endTimeMs = Date.now() + 80000;
    this._nav.goToScreen(WordHuntScreen);
  }
}

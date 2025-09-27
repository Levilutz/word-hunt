import { sound } from "@pixi/sound";
import gsap from "gsap";
import { Container, type PointData } from "pixi.js";
import type { AppScreen } from "../Navigation";
import type { AppState } from "../State";
import type { WordType } from "../theme";
import Scoreboard from "../ui/Scoreboard";
import WordHuntGrid from "../ui/WordHuntGrid";
import WordHuntGridHitArea from "../ui/WordHuntGridHitArea";
import WordHuntWord from "../ui/WordHuntWord";
import { pointsForWord } from "../utils";

export default class WordHuntScreen extends Container implements AppScreen {
  /** A reference to the global app state. */
  private readonly _appState: AppState;

  /** The width of the screen's area in Px. */
  private _w: number = 200;

  /** The height of the screen's area in Px. */
  private _h: number = 200;

  /** The current path of pressed tiles. */
  private _curPath: PointData[] = [];

  /** A child container for the grid of tiles. */
  private readonly _wordHuntGrid: WordHuntGrid;

  /** A child container for managing the hit area over the grid. */
  private readonly _wordHuntGridHitArea: WordHuntGridHitArea;

  /** A child container for showing the currently-selected word. */
  private readonly _curWordPreview: WordHuntWord;

  /** A child container for the scoreboard. */
  private readonly _scoreboard: Scoreboard;

  constructor(appState: AppState, w: number, h: number) {
    super();

    this._appState = appState;

    this._w = w;
    this._h = h;

    this._wordHuntGrid = new WordHuntGrid(
      this._w * 0.125,
      300,
      Math.max(this._w * 0.75, 100),
      Math.max(this._h - 350, 100),
      { x: 0.5, y: 0 },
      this._appState.grid,
      this._curPath,
      "invalid",
    );
    this.addChild(this._wordHuntGrid);

    this._curWordPreview = new WordHuntWord(this._w / 2, 270, "", undefined);
    this.addChild(this._curWordPreview);

    this._wordHuntGridHitArea = new WordHuntGridHitArea(
      this._w,
      this._h,
      this._wordHuntGrid,
      this.handlePathHover.bind(this),
      this.handlePathSubmit.bind(this),
    );
    this.addChild(this._wordHuntGridHitArea);

    const scoreboardW = Math.min(this._w, 500);
    this._scoreboard = new Scoreboard(
      (this._w - scoreboardW) * 0.5,
      10,
      scoreboardW,
      120,
      this._appState.score,
      this._appState.submittedWords.length,
      Date.now() + 78500,
    );
    this.addChild(this._scoreboard);
  }

  resize(w: number, h: number) {
    // Update w and h top-level fields, and calculated fields
    this._w = w;
    this._h = h;

    this._wordHuntGrid.resize(
      this._w * 0.125,
      300,
      Math.max(this._w * 0.75, 100),
      Math.max(this._h - 350, 100),
    );
    this._wordHuntGridHitArea.resize(this._w, this._h);
    this._curWordPreview.setPos(this._w / 2, 270);
    const scoreboardW = Math.min(this._w - 20, 400);
    this._scoreboard.setBounds(
      (this._w - scoreboardW) * 0.5,
      10,
      scoreboardW,
      120,
    );
  }

  private handlePathHover(path: PointData[]) {
    this._curPath = path;
    const curWord = path
      .map(({ x, y }) => this._appState.grid[y][x] ?? "")
      .join("");
    const curWordType = this._appState.trie.containsWord(curWord)
      ? this._appState.submittedWords.includes(curWord)
        ? "valid-used"
        : "valid-new"
      : "invalid";
    this._curWordPreview.setContent(curWord, curWordType);
    this._wordHuntGrid.updatePath(this._curPath, curWordType);
    this.playWordHoverSound(curWord, curWordType);
  }

  private handlePathSubmit(path: PointData[]) {
    const curWord = path
      .map(({ x, y }) => this._appState.grid[y][x] ?? "")
      .join("");
    if (
      this._appState.trie.containsWord(curWord) &&
      !this._appState.submittedWords.includes(curWord)
    ) {
      this._appState.submittedWords.push(curWord);
      this._appState.score += pointsForWord(curWord);
      this._scoreboard.setScore(
        this._appState.score,
        this._appState.submittedWords.length,
      );
      this.toastPoints(pointsForWord(curWord));
      this.playWordSubmitSound(curWord);
    }
    this.handlePathHover([]);
  }

  private toastPoints(points: number) {
    if (points <= 0) {
      return;
    }
    const toastChip = new WordHuntWord(
      this._w / 2,
      270,
      `+${points}`,
      "valid-new",
    );
    this.addChild(toastChip);
    gsap.to(toastChip, {
      y: 180,
      alpha: 0,
      onComplete: () => {
        this.removeChild(toastChip);
        toastChip.destroy({ children: true });
      },
    });
  }

  private playWordHoverSound(word: string, wordType: WordType) {
    if (word.length < 3 || word.length > 8) {
      return;
    }
    if (wordType === "invalid" || wordType === "valid-used") {
      return;
    }
    sound.play("click");
  }

  private playWordSubmitSound(word: string) {
    if (word.length < 3 || word.length > 8) {
      return;
    }
    sound.play(`trill${word.length - 2}`);
  }
}

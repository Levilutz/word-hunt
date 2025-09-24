import { Container, Graphics, Text } from "pixi.js";

export default class WordHuntTile extends Container {
  private readonly _graphics: Graphics;
  private readonly _text: Text;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    content: string,
  ) {
    super({ x, y, width, height });

    this._graphics = new Graphics();
    this.addChild(this._graphics);

    this._text = new Text({
      text: content,
      style: { fill: 0xff00ff, fontSize: 36, fontFamily: "Helvetica" },
      anchor: 0.5,
    });
    this.addChild(this._text);

    this.render();
  }

  render() {
    this._graphics.clear();
    this._graphics
      .rect(0, 0, this.width, this.height)
      .stroke({ width: 2, color: 0x0000ff });
  }
}

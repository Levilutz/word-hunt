import {
  Configuration,
  DefaultApi,
  type GetGameResp,
} from "../word-hunt-service";

export const rawClient = new DefaultApi(
  new Configuration({
    basePath: `${window.location.protocol}//${window.location.host}/api`,
  }),
);

export class GameClient {
  private rawClient: DefaultApi;
  private gameId: string;
  private closed: boolean = false;
  private timeoutId?: number;
  private hasDeclaredStart: boolean = false;
  private lastResp?: GetGameResp;

  constructor(rawClient: DefaultApi, gameId: string) {
    this.rawClient = rawClient;
    this.gameId = gameId;
    this.pollGame().catch((error) => console.log(error));
  }

  close() {
    this.closed = true;
    if (this.timeoutId !== undefined) {
      window.clearTimeout(this.timeoutId);
    }
  }

  get game(): GetGameResp | undefined {
    return this.lastResp;
  }

  private async pollGame(): Promise<void> {
    try {
      const resp = await this.rawClient.getGameGameGameIdGet({
        gameId: this.gameId,
      });
      this.lastResp = resp;
      if (!this.hasDeclaredStart) {
        this.rawClient
          .gameStartGameGameIdStartPost({ gameId: this.gameId })
          .then(() => {
            this.hasDeclaredStart = true;
          })
          .catch((error) => console.log(error));
      }
      if (resp.ended) {
        await this.rawClient.gameSetPlayerDoneGameGameIdDonePost({
          gameId: this.gameId,
        });
        return;
      }
    } catch (error) {
      console.log(error);
    }
    if (!this.closed) {
      window.setTimeout(this.pollGame.bind(this), 2000);
    }
  }
}

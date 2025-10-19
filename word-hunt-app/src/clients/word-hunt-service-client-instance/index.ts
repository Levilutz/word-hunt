import { Configuration, DefaultApi } from "../word-hunt-service";

export const rawClient = new DefaultApi(
  new Configuration({
    basePath: `${window.location.protocol}//${window.location.host}/api`,
  }),
);

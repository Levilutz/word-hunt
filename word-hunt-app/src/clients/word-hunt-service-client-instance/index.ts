import { Configuration, DefaultApi } from "../word-hunt-service";

export const client = new DefaultApi(
  new Configuration({
    basePath: `${window.location.protocol}//${window.location.host}/api`,
  }),
);

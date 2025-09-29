import { createFileRoute } from "@tanstack/react-router";
import { Configuration, DefaultApi } from "@/clients/word-hunt-service";
import Header from "@/components/Header";
import logo from "../logo.svg";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  return (
    <>
      <Header />
      <h1>Hello World!</h1>
      <img src={logo} width="100px" alt="logo" />
      <button
        onClick={() => {
          const config = new Configuration({
            basePath: "http://localhost:8000",
          });
          new DefaultApi(config).pingPingGet().then((res) => console.log(res));
        }}
      >
        Click me!
      </button>
    </>
  );
}

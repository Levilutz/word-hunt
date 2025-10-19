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
      <h1>Word Hunt</h1>
      <button
        onClick={() => {
          const config = new Configuration({
            basePath: "http://localhost:5173/api",
          });
          new DefaultApi(config).pingPingGet().then((res) => console.log(res));
        }}
      >
        Click me!
      </button>
    </>
  );
}

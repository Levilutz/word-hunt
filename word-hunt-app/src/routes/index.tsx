import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";
import { Configuration, DefaultApi } from "@/clients/word-hunt-service";
import Header from "@/components/Header";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const navigate = useNavigate({ from: "/" });
  return (
    <>
      <Header />
      <h1>Word Hunt</h1>
      <button onClick={() => navigate({ to: "/match" })}>Nav to match!</button>
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

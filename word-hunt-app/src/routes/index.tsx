import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { client } from "@/clients/word-hunt-service-client-instance";
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
      <button onClick={() => navigate({ to: "/match" })}>Start</button>
      <button
        onClick={() => {
          client.pingPingGet().then((res) => {
            console.log(res);
          });
        }}
      >
        Click me!
      </button>
    </>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { client } from "@/clients/word-hunt-service-client-instance";
import Header from "@/components/Header";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const [matching, setMatching] = useState(false);
  const [buttonText, setButtonText] = useState("Start");
  const navigate = useNavigate({ from: "/" });

  return (
    <>
      <Header />
      <h1>Word Hunt</h1>
      <button
        type="button"
        disabled={matching}
        onClick={() => {
          setButtonText("Matching...");
          setMatching(true);
          client
            .matchMatchPost()
            .then((resp) => {
              if (resp.gameId != null) {
                navigate({
                  to: "/game/$gameId",
                  params: { gameId: resp.gameId },
                });
              } else {
                setButtonText("Try Again?");
                setMatching(false);
              }
            })
            .catch((err) => {
              console.log(err);
              setButtonText("Error");
              setMatching(false);
            });
        }}
      >
        {buttonText}
      </button>
      <button
        type="button"
        onClick={() => {
          client.cookie0Cookie0Get();
        }}
      >
        Set Cookie
      </button>
      <button
        type="button"
        onClick={() => {
          navigate({
            to: "/game/$gameId",
            params: { gameId: "4c35e055-fe2e-41b0-aa50-1e7cb3641ff9" },
          });
        }}
      >
        Finished Game
      </button>
    </>
  );
}

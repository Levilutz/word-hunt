import { createFileRoute, useParams } from "@tanstack/react-router";
import GamePlay from "@/components/GamePlay";
import GameResult from "@/components/GameResult";

export const Route = createFileRoute("/game/$gameId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { gameId } = useParams({ from: "/game/$gameId" });
  return (
    <>
      <h1>{`Hello "/game/${gameId}!`}</h1>
      <GamePlay />
      <GameResult />
    </>
  );
}

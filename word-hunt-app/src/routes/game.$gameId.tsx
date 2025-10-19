import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { rawClient } from "@/clients/word-hunt-service-client-instance";
import GamePlay from "@/components/GamePlay";
import GameResult from "@/components/GameResult";

export const Route = createFileRoute("/game/$gameId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { gameId } = useParams({ from: "/game/$gameId" });
  const { isPending, error, data } = useQuery({
    queryKey: ["game", gameId],
    queryFn: () => rawClient.getGameGameGameIdGet({ gameId }),
  });

  if (isPending) {
    console.log("Rendering pending");
    return <h1>Pending</h1>;
  }
  if (error != null) {
    console.log("Rendering error");
    return <h1>Error</h1>;
  }
  if (data.ended || data.thisPlayer.secondsRemaining === 0) {
    return <GameResult gameId={gameId} />;
  } else {
    return <GamePlay gameId={gameId} />;
  }
}

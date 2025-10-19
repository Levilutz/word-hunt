import { useQuery } from "@tanstack/react-query";
import { client } from "@/clients/word-hunt-service-client-instance";

export default function GameResult({ gameId }: { gameId: string }) {
  console.log("Rendering result");
  const { isPending, error, data } = useQuery({
    queryKey: ["game", gameId],
    queryFn: () => client.getGameGameGameIdGet({ gameId }),
  });

  if (isPending || error != null) {
    console.log("not yet");
    return null;
  }

  return (
    <h1>
      RESULT: {data.thisPlayer.points} / {data.otherPlayer.points}
    </h1>
  );
}

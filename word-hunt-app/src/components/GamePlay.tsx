import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { client } from "@/clients/word-hunt-service-client-instance";

export default function GamePlay({ gameId }: { gameId: string }) {
  console.log("Rendering play");
  const { isPending, error, data } = useQuery({
    queryKey: ["game", gameId],
    queryFn: () => client.getGameGameGameIdGet({ gameId }),
    refetchInterval: 2000,
  });

  useEffect(() => {
    client.gameStartGameGameIdStartPost({ gameId });
  }, [gameId]);

  if (isPending || error != null) {
    console.log("not yet");
    return null;
  }

  return (
    <h1>
      PLAY: {data.thisPlayer.points} / {data.otherPlayer.points} |{" "}
      {data.thisPlayer.secondsRemaining}
    </h1>
  );
}

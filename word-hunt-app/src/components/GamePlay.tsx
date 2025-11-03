import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { client } from "@/clients/word-hunt-service-client-instance";
import { extractWord } from "@/utils";

export default function GamePlay({ gameId }: { gameId: string }) {
  console.log("Rendering play");
  const { isPending, error, data } = useQuery({
    queryKey: ["game", gameId],
    queryFn: () => client.getGameGameGameIdGet({ gameId }),
    refetchInterval: 2000,
  });
  const [curWords, setCurWords] = useState<Set<string>>(new Set());
  const [curPoints, setCurPoints] = useState(0);

  useEffect(() => {
    client.gameStartGameGameIdStartPost({ gameId });
  }, [gameId]);

  useEffect(() => {
    if (data == null) {
      return;
    }
    setCurWords((prev) => new Set([...prev, ...data.thisPlayer.words]));
  }, [data]);

  useEffect(() => {
    setCurPoints(100 * curWords.size);
  }, [curWords]);

  const onSubmitWord = useCallback(
    (path: { x: number; y: number }[]) => {
      if (data == null) {
        return;
      }
      const word = extractWord(data.grid, path);
      if (word == null) {
        return;
      }
      setCurWords((prev) => new Set([...prev, word]));
    },
    [data],
  );

  if (isPending || error != null) {
    console.log("not yet");
    return null;
  }

  return (
    <>
      <h1>
        PLAY: {curPoints} / {data.otherPlayer.points} |{" "}
        {data.thisPlayer.secondsRemaining} {[...curWords].join(",")}
      </h1>
      <button
        type="button"
        onClick={() =>
          onSubmitWord([
            { x: 1, y: 1 },
            { x: 2, y: 2 },
            { x: 2, y: 1 },
          ])
        }
      >
        Click me!
      </button>
    </>
  );
}

import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import type { Point } from "@/clients/word-hunt-service";
import { client } from "@/clients/word-hunt-service-client-instance";
import { extractWord } from "@/utils";

const DUMMY_PATH = [
  { x: 1, y: 1 },
  { x: 2, y: 2 },
  { x: 2, y: 1 },
];

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

  const { mutate: submitWordToBackendMutation } = useMutation({
    mutationFn: async (path: Point[]) => {
      await client.gameSubmitWordsGameGameIdSubmitWordsPost({
        gameId,
        submitWordsReq: { paths: [path] },
      });
    },
    mutationKey: ["submit-word"],
    retry: (_numFailures: number, error: Error) => {
      console.log(`retrying, error: ${error}`);
      return true;
    },
    retryDelay: (attempt: number) => Math.min(2 ** attempt * 1000, 10000),
  });

  const onSubmitWord = useCallback(
    (word: string, path: { x: number; y: number }[]) => {
      submitWordToBackendMutation(path);
      setCurWords((prev) => new Set([...prev, word]));
    },
    [submitWordToBackendMutation],
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
          onSubmitWord(extractWord(data.grid, DUMMY_PATH) ?? "", DUMMY_PATH)
        }
      >
        Click me!
      </button>
    </>
  );
}

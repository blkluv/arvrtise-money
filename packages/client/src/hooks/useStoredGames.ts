import { useState, useEffect } from "react";
import { DateTime } from "luxon";
import useLocalStorage from "@rehooks/local-storage";
import { getGameStatus } from "../api";
import { IGameState } from "@monopoly-money/game-state";

const storedGamesLocalStorageKey = "storedGames";

interface IStoredGameInLocalStorage {
  gameId: string;
  userToken: string;
  playerId: string;
  time: string;
}

export interface IStoredGame extends IStoredGameInLocalStorage {
  status: IGameState | null;
}

const useStoredGames = () => {
  const [abortController] = useState(() => new AbortController());
  const [storedGames, setStoredGames] = useLocalStorage<IStoredGameInLocalStorage[]>(
    storedGamesLocalStorageKey,
    []
  );
  const [gameStatuses, setGameStatuses] = useState<Record<string, IGameState | null>>({});

  const storeGame = (gameId: string, userToken: string, playerId: string) => {
    setStoredGames([
      ...(storedGames ?? []).filter((game) => game.gameId !== gameId), // Remove current instance
      {
        gameId,
        userToken,
        playerId,
        time: DateTime.local().toISO()
      }
    ]);
  };

  // Identify if we need to fetch some new game data
  useEffect(() => {
    const gamesWithoutStatuses = (storedGames ?? []).filter(
      (game) => Object.keys(gameStatuses).indexOf(game.gameId) === -1
    );

    gamesWithoutStatuses.forEach(({ gameId, userToken }) => {
      // Initially insert a null (to stop multiple requests)
      setGameStatuses((current) => ({
        ...current,
        [gameId]: null
      }));

      // Make the request
      getGameStatus(gameId, userToken, abortController)
        .then((status) => {
          if (status === "DoesNotExist") {
            // Remove the game if it no longer exists
            setStoredGames((storedGames ?? []).filter((g) => g.gameId !== gameId));
            setGameStatuses((current) =>
              Object.keys(current).reduce((acc, curr) => {
                if (curr !== gameId) {
                  return { ...acc, [gameId]: current[gameId] };
                } else {
                  return acc;
                }
              }, {} as Record<string, IGameState | null>)
            );
          } else {
            // Add the status
            setGameStatuses((current) => ({
              ...current,
              [gameId]: status
            }));
          }
        })
        .catch((error) => error?.name === "DOMException" && console.error(error)); // Ignore `DOMException: The user aborted a request.`
    });
  }, [storedGames, gameStatuses]);

  // Abort all requests on unmount
  useEffect(() => {
    return () => {
      abortController.abort();
    };
  }, []);

  // Merge the games and statuses together
  const storedGamesWithDetail: IStoredGame[] = (storedGames ?? []).map((game) => ({
    ...game,
    status: gameStatuses[game.gameId] ?? null
  }));

  return { storedGames: storedGamesWithDetail, storeGame };
};

export default useStoredGames;
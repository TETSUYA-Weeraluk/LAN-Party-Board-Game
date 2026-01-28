"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSocket, getSessionId, clearSessionId } from "@/lib/socket";
import type { RoomInfo } from "@/types/shared";
import type { Player, PlayerWithWord } from "@/game/who-am-i";
import { LobbyScreen, GameScreen, RoundEndScreen, RulesButton } from "@/game/who-am-i";
import JoinRoomForm from "@/components/JoinRoomForm";

type GameState = "loading" | "joining" | "lobby" | "playing" | "round-end";

// Error toast component
function ErrorToast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg animate-bounce">
        ⚠️ {message}
      </div>
    </div>
  );
}

export default function WhoAmIRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  // Game state
  const [gameState, setGameState] = useState<GameState>("loading");
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [currentRoomName, setCurrentRoomName] = useState<string>("");

  // Player state
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Game state
  const [category, setCategory] = useState<string>("");
  const [otherPlayers, setOtherPlayers] = useState<PlayerWithWord[]>([]);
  const [timerDuration, setTimerDuration] = useState(0);
  const [timerStartedAt, setTimerStartedAt] = useState(0);
  const [myRevealedWord, setMyRevealedWord] = useState<string | null>(null);

  // Multi-round state
  const [currentRound, setCurrentRound] = useState(0);
  const [playedCategories, setPlayedCategories] = useState<string[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const socket = getSocket();
    const sessionId = getSessionId();

    // Try to rejoin or get room info
    const handleConnect = () => {
      console.log("Socket connected, attempting to rejoin room:", roomId);
      socket.emit("rejoin", { sessionId });
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on("connect", handleConnect);
    }

    // Rejoin success
    socket.on("rejoinSuccess", (data) => {
      if (data.roomId === roomId) {
        setCurrentRoomName(data.roomName);
        setCurrentPlayer(data.player);
        setIsHost(data.isHost);
        setPlayers(data.players);
        setAllPlayers(data.players);

        if (data.gameState === "playing" && data.otherPlayers) {
          setCategory(data.category || "");
          setOtherPlayers(data.otherPlayers);
          setTimerDuration(data.timerDuration || 0);
          setTimerStartedAt(data.timerStartedAt || 0);
          setCurrentRound(data.currentRound || 0);
          setPlayedCategories(data.playedCategories || []);
          setGameState("playing");
        } else if (data.gameState === "round-end") {
          setCurrentRound(data.currentRound || 0);
          setPlayedCategories(data.playedCategories || []);
          setGameState("round-end");
        } else {
          setGameState("lobby");
        }
      } else {
        // User is in a different room, redirect
        router.push(`/who-am-i/${data.roomId}`);
      }
    });

    // Rejoin failed - show join form
    socket.on("rejoinFailed", () => {
      // Get room info to show join form
      socket.emit("getRoomInfo", { roomId });
    });

    // Room info received
    socket.on("roomInfo", (info: RoomInfo | null) => {
      if (info && info.id === roomId) {
        setRoomInfo(info);
        setGameState("joining");
      } else {
        // Room doesn't exist
        setError("ไม่พบห้องนี้");
        setTimeout(() => router.push("/who-am-i"), 2000);
      }
    });

    // Room joined
    socket.on("roomJoined", ({ roomId: joinedRoomId, roomName, player, isHost: hostStatus }) => {
      if (joinedRoomId === roomId) {
        setCurrentRoomName(roomName);
        setCurrentPlayer(player);
        setIsHost(hostStatus);
        setGameState("lobby");
      }
    });

    // Players update
    socket.on("playersUpdate", (updatedPlayers) => {
      setPlayers(updatedPlayers as Player[]);
      setAllPlayers(updatedPlayers as Player[]);
    });

    // Game started
    socket.on("gameStarted", (data) => {
      setCategory(data.category);
      setOtherPlayers(data.otherPlayers);
      setTimerDuration(data.timerDuration);
      setTimerStartedAt(data.timerStartedAt);
      setCurrentRound(data.currentRound);
      setPlayedCategories(data.playedCategories);
      setIsStarting(false);
      setMyRevealedWord(null);

      setCurrentPlayer((prev) =>
        prev ? { ...prev, hasAnswered: false, answerOrder: undefined, isEliminated: false } : null
      );

      setAllPlayers((prev) =>
        prev.map((p) => ({
          ...p,
          hasAnswered: false,
          answerOrder: undefined,
          isEliminated: false,
        }))
      );

      setGameState("playing");
    });

    // Player answered
    socket.on("playerAnswered", (data) => {
      setOtherPlayers((prev) =>
        prev.map((p) =>
          p.id === data.playerId
            ? {
                ...p,
                hasAnswered: true,
                answerOrder: data.order,
                score: data.totalScore,
              }
            : p
        )
      );

      setAllPlayers((prev) =>
        prev.map((p) =>
          p.id === data.playerId
            ? {
                ...p,
                hasAnswered: true,
                answerOrder: data.order,
                score: data.totalScore,
              }
            : p
        )
      );

      setCurrentPlayer((prev) =>
        prev && prev.id === data.playerId
          ? {
              ...prev,
              hasAnswered: true,
              answerOrder: data.order,
              score: data.totalScore,
            }
          : prev
      );
    });

    // Player eliminated (wrong answer)
    socket.on("playerEliminated", (data) => {
      setOtherPlayers((prev) =>
        prev.map((p) =>
          p.id === data.playerId
            ? { ...p, isEliminated: true }
            : p
        )
      );

      setAllPlayers((prev) =>
        prev.map((p) =>
          p.id === data.playerId
            ? { ...p, isEliminated: true }
            : p
        )
      );

      setCurrentPlayer((prev) =>
        prev && prev.id === data.playerId
          ? { ...prev, isEliminated: true }
          : prev
      );
    });

    // Round ended
    socket.on("roundEnded", (data) => {
      setAllPlayers(data.players);
      setPlayedCategories(data.playedCategories);
      setCurrentRound(data.currentRound);

      setCurrentPlayer((prev) => {
        if (!prev) return null;
        const myData = data.players.find((p) => p.id === prev.id);
        return myData || prev;
      });

      setGameState("round-end");
    });

    // Room closed
    socket.on("roomClosed", () => {
      clearSessionId();
      router.push("/who-am-i");
    });

    // Word revealed
    socket.on("wordRevealed", (word) => {
      setMyRevealedWord(word);
    });

    // Left room
    socket.on("leftRoom", () => {
      router.push("/who-am-i");
    });

    // Error handling
    socket.on("error", (message) => {
      setError(message);
      setIsStarting(false);
      setTimeout(() => setError(null), 3000);
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.off("rejoinSuccess");
      socket.off("rejoinFailed");
      socket.off("roomInfo");
      socket.off("roomJoined");
      socket.off("playersUpdate");
      socket.off("gameStarted");
      socket.off("playerAnswered");
      socket.off("playerEliminated");
      socket.off("roundEnded");
      socket.off("roomClosed");
      socket.off("wordRevealed");
      socket.off("leftRoom");
      socket.off("error");
    };
  }, [roomId, router]);

  // Handle leave room
  const handleLeaveRoom = useCallback(() => {
    const socket = getSocket();
    socket.emit("leaveRoom", { roomId });
  }, [roomId]);

  // Handle start game
  const handleStartGame = useCallback(
    (selectedCategory: string | null, timerMinutes: number) => {
      const socket = getSocket();
      setIsStarting(true);
      socket.emit("startGame", {
        category: selectedCategory,
        timerMinutes,
      });
    },
    []
  );

  // Handle close room
  const handleCloseRoom = useCallback(() => {
    const socket = getSocket();
    socket.emit("closeRoom");
  }, []);

  // Handle reveal word
  const handleRevealWord = useCallback(() => {
    const socket = getSocket();
    socket.emit("revealMyWord");
  }, []);

  // Handle mark correct
  const handleMarkCorrect = useCallback((playerId: string) => {
    const socket = getSocket();
    socket.emit("markCorrect", playerId);
  }, []);

  // Handle mark wrong
  const handleMarkWrong = useCallback((playerId: string) => {
    const socket = getSocket();
    socket.emit("markWrong", playerId);
  }, []);

  // Handle next round
  const handleNextRound = useCallback(
    (selectedCategory: string | null, timerMinutes: number) => {
      const socket = getSocket();
      setIsStarting(true);
      socket.emit("nextRound", {
        category: selectedCategory,
        timerMinutes,
      });
    },
    []
  );

  // Handle join room from URL
  const handleJoinRoom = useCallback(
    (_roomId: string, password: string | null, playerName: string) => {
      const socket = getSocket();
      const sessionId = getSessionId();
      socket.emit("joinRoom", { roomId, password, playerName, sessionId });
    },
    [roomId]
  );

  // Loading state
  if (gameState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
        <RulesButton />
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🎭</div>
          <p className="text-white text-xl">กำลังเชื่อมต่อห้อง...</p>
        </div>
      </div>
    );
  }

  // Join room state
  if (gameState === "joining" && roomInfo) {
    return (
      <>
        <RulesButton />
        <ErrorToast message={error} />
        <JoinRoomForm
          room={roomInfo}
          onSubmit={handleJoinRoom}
          onBack={() => router.push("/who-am-i")}
        />
      </>
    );
  }

  // Lobby screen
  if (gameState === "lobby" && currentPlayer) {
    return (
      <>
        <RulesButton />
        <ErrorToast message={error} />
        <LobbyScreen
          roomId={roomId}
          roomName={currentRoomName}
          players={players}
          currentPlayerId={currentPlayer.id}
          isHost={isHost}
          onStartGame={handleStartGame}
          onCloseRoom={handleCloseRoom}
          onLeaveRoom={handleLeaveRoom}
          isStarting={isStarting}
        />
      </>
    );
  }

  // Game screen
  if (gameState === "playing" && currentPlayer) {
    return (
      <>
        <RulesButton />
        <ErrorToast message={error} />
        <GameScreen
          category={category}
          currentPlayerName={currentPlayer.name}
          currentPlayerId={currentPlayer.id}
          otherPlayers={otherPlayers}
          allPlayers={allPlayers}
          timerDuration={timerDuration}
          timerStartedAt={timerStartedAt}
          isHost={isHost}
          currentRound={currentRound}
          onCloseRoom={handleCloseRoom}
          onRevealWord={handleRevealWord}
          onMarkCorrect={handleMarkCorrect}
          onMarkWrong={handleMarkWrong}
          myRevealedWord={myRevealedWord}
          myHasAnswered={currentPlayer.hasAnswered}
          myIsEliminated={currentPlayer.isEliminated || false}
        />
      </>
    );
  }

  // Round end screen
  if (gameState === "round-end" && currentPlayer) {
    return (
      <>
        <RulesButton />
        <ErrorToast message={error} />
        <RoundEndScreen
          players={allPlayers}
          currentPlayerId={currentPlayer.id}
          currentRound={currentRound}
          playedCategories={playedCategories}
          isHost={isHost}
          onNextRound={handleNextRound}
          onCloseRoom={handleCloseRoom}
          isStarting={isStarting}
        />
      </>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      <RulesButton />
      <ErrorToast message={error} />
      <div className="text-center">
        <div className="text-6xl mb-4 animate-bounce">🎭</div>
        <p className="text-white text-xl">กำลังโหลด...</p>
      </div>
    </div>
  );
}

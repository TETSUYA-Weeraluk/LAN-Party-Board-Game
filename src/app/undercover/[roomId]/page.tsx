"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSocket, getSessionId, clearSessionId } from "@/lib/socket";
import type { Player, RoomInfo } from "@/types/shared";
import type { UndercoverPlayer, UndercoverRole, UndercoverVoteResultData, UndercoverMrWhiteGuessResultData, UndercoverWinResult } from "@/game/undercover";
import { UndercoverLobbyScreen, UndercoverGameScreen, UndercoverRoundEndScreen } from "@/game/undercover";
import JoinRoomForm from "@/components/JoinRoomForm";

type GameState = "loading" | "joining" | "lobby" | "playing" | "round-end";

// Error toast component
function ErrorToast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg animate-bounce">
        {message}
      </div>
    </div>
  );
}

export default function UndercoverRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  // Game state
  const [gameState, setGameState] = useState<GameState>("loading");
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [currentRoomName, setCurrentRoomName] = useState<string>("");

  // Player state
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const currentPlayerIdRef = useRef<string | null>(null);
  const [players, setPlayers] = useState<UndercoverPlayer[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Game state
  const [myRole, setMyRole] = useState<UndercoverRole>("civilian");
  const [myWord, setMyWord] = useState<string | null>(null);
  const [alivePlayers, setAlivePlayers] = useState<UndercoverPlayer[]>([]);
  const [spectators, setSpectators] = useState<UndercoverPlayer[]>([]);
  const [isSpectator, setIsSpectator] = useState(false);

  // Vote state
  const [voteResult, setVoteResult] = useState<UndercoverVoteResultData | null>(null);
  const [mrWhiteGuessResult, setMrWhiteGuessResult] = useState<UndercoverMrWhiteGuessResultData | null>(null);
  const [waitingForMrWhiteGuess, setWaitingForMrWhiteGuess] = useState(false);

  // Round end state
  const [roundResult, setRoundResult] = useState<UndercoverWinResult>("civilian-win");
  const [civilianWord, setCivilianWord] = useState<string>("");
  const [undercoverWord, setUndercoverWord] = useState<string>("");
  const [currentRound, setCurrentRound] = useState(0);

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
        currentPlayerIdRef.current = data.player.id;
        setIsHost(data.isHost);
        setPlayers((data.players as unknown) as UndercoverPlayer[]);

        if (data.gameState === "playing") {
          setMyRole(data.myRole || "civilian");
          setMyWord(data.myWord || null);
          setAlivePlayers(data.alivePlayers || []);
          setSpectators(data.spectators || []);
          setCurrentRound(data.currentRound || 0);
          
          // Check if current player is spectator
          const currentPlayerData = data.alivePlayers?.find((p: UndercoverPlayer) => p.id === data.player.id);
          setIsSpectator(!currentPlayerData);
          
          setGameState("playing");
        } else if (data.gameState === "round-end") {
          setCurrentRound(data.currentRound || 0);
          setCivilianWord(data.civilianWord || "");
          setUndercoverWord(data.undercoverWord || "");
          setRoundResult(data.undercoverRoundResult || "civilian-win");
          setGameState("round-end");
        } else {
          // Separate players into active and spectators
          const allPlayers = (data.players as unknown) as UndercoverPlayer[];
          setAlivePlayers(allPlayers.filter(p => !p.isSpectator));
          setSpectators(allPlayers.filter(p => p.isSpectator));
          setGameState("lobby");
        }
      } else {
        router.push(`/undercover/${data.roomId}`);
      }
    });

    // Rejoin failed
    socket.on("rejoinFailed", () => {
      socket.emit("getRoomInfo", { roomId });
    });

    // Room info received
    socket.on("roomInfo", (info: RoomInfo | null) => {
      if (info && info.id === roomId) {
        setRoomInfo(info);
        setGameState("joining");
      } else {
        setError("ไม่พบห้องนี้");
        setTimeout(() => router.push("/undercover"), 2000);
      }
    });

    // Room joined
    socket.on("roomJoined", ({ roomId: joinedRoomId, roomName, player, isHost: hostStatus }) => {
      if (joinedRoomId === roomId) {
        setCurrentRoomName(roomName);
        setCurrentPlayer(player);
        currentPlayerIdRef.current = player.id;
        setIsHost(hostStatus);
        setGameState("lobby");
      }
    });

    // Players update (generic)
    socket.on("playersUpdate", (updatedPlayers) => {
      const undercoverPlayers = (updatedPlayers as unknown) as UndercoverPlayer[];
      setPlayers(undercoverPlayers);
      setAlivePlayers(undercoverPlayers.filter(p => !p.isSpectator));
      setSpectators(undercoverPlayers.filter(p => p.isSpectator));
    });

    // Undercover players update
    socket.on("undercoverPlayersUpdate", (data) => {
      setAlivePlayers(data.alivePlayers);
      setSpectators(data.spectators);
      setPlayers([...data.alivePlayers, ...data.spectators]);
      
      // Update isSpectator status using ref
      if (currentPlayerIdRef.current) {
        const isSpec = data.spectators.some((p: UndercoverPlayer) => p.id === currentPlayerIdRef.current);
        setIsSpectator(isSpec);
      }
    });

    // Undercover game started
    socket.on("undercoverGameStarted", (data) => {
      setMyRole(data.role);
      setMyWord(data.word);
      setAlivePlayers(data.alivePlayers);
      setSpectators(data.spectators);
      setCurrentRound(data.currentRound);
      setIsStarting(false);
      setVoteResult(null);
      setMrWhiteGuessResult(null);
      setWaitingForMrWhiteGuess(false);
      
      // Check if current player is spectator using ref
      if (currentPlayerIdRef.current) {
        const isSpec = data.spectators.some((p: UndercoverPlayer) => p.id === currentPlayerIdRef.current);
        setIsSpectator(isSpec);
      }
      
      setGameState("playing");
    });

    // Vote result
    socket.on("undercoverVoteResult", (data) => {
      setVoteResult(data);
      setWaitingForMrWhiteGuess(data.isMrWhiteGuessing);
      
      // Update alive players - remove voted player
      setAlivePlayers(prev => prev.filter(p => p.id !== data.votedPlayerId));
    });

    // Mr.White guess result
    socket.on("undercoverMrWhiteGuessResult", (data) => {
      setMrWhiteGuessResult(data);
      setWaitingForMrWhiteGuess(false);
    });

    // Round ended
    socket.on("undercoverRoundEnded", (data) => {
      setPlayers(data.players);
      setRoundResult(data.result);
      setCivilianWord(data.civilianWord);
      setUndercoverWord(data.undercoverWord);
      setCurrentRound(data.currentRound);
      setIsStarting(false);
      setVoteResult(null);
      setMrWhiteGuessResult(null);
      setWaitingForMrWhiteGuess(false);
      setGameState("round-end");
    });

    // Room closed
    socket.on("roomClosed", () => {
      clearSessionId();
      router.push("/undercover");
    });

    // Left room
    socket.on("leftRoom", () => {
      router.push("/undercover");
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
      socket.off("undercoverPlayersUpdate");
      socket.off("undercoverGameStarted");
      socket.off("undercoverVoteResult");
      socket.off("undercoverMrWhiteGuessResult");
      socket.off("undercoverRoundEnded");
      socket.off("roomClosed");
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
  const handleStartGame = useCallback(() => {
    const socket = getSocket();
    setIsStarting(true);
    socket.emit("startUndercoverGame");
  }, []);

  // Handle close room
  const handleCloseRoom = useCallback(() => {
    const socket = getSocket();
    socket.emit("closeRoom");
  }, []);

  // Handle toggle spectator
  const handleToggleSpectator = useCallback((spectator: boolean) => {
    const socket = getSocket();
    socket.emit("toggleSpectator", spectator);
  }, []);

  // Handle vote
  const handleVote = useCallback((playerId: string) => {
    const socket = getSocket();
    socket.emit("undercoverVote", { playerId });
  }, []);

  // Handle Mr.White guess
  const handleMrWhiteGuess = useCallback((guess: string) => {
    const socket = getSocket();
    socket.emit("undercoverMrWhiteGuess", { guess });
  }, []);

  // Handle end game
  const handleEndGame = useCallback(() => {
    const socket = getSocket();
    socket.emit("endUndercoverGame");
  }, []);

  // Handle next round
  const handleNextRound = useCallback(() => {
    const socket = getSocket();
    setIsStarting(true);
    socket.emit("startUndercoverGame");
  }, []);

  // Handle join room
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
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
        <ErrorToast message={error} />
        <JoinRoomForm
          room={roomInfo}
          onSubmit={handleJoinRoom}
          onBack={() => router.push("/undercover")}
          accentColor="purple"
        />
      </>
    );
  }

  // Lobby screen
  if (gameState === "lobby" && currentPlayer) {
    return (
      <>
        <ErrorToast message={error} />
        <UndercoverLobbyScreen
          roomId={roomId}
          roomName={currentRoomName}
          players={players}
          currentPlayerId={currentPlayer.id}
          isHost={isHost}
          onStartGame={handleStartGame}
          onCloseRoom={handleCloseRoom}
          onLeaveRoom={handleLeaveRoom}
          onToggleSpectator={handleToggleSpectator}
          isStarting={isStarting}
        />
      </>
    );
  }

  // Game screen
  if (gameState === "playing" && currentPlayer) {
    return (
      <>
        <ErrorToast message={error} />
        <UndercoverGameScreen
          currentPlayerId={currentPlayer.id}
          currentPlayerName={currentPlayer.name}
          myRole={myRole}
          myWord={myWord}
          alivePlayers={alivePlayers}
          spectators={spectators}
          isHost={isHost}
          isSpectator={isSpectator}
          currentRound={currentRound}
          voteResult={voteResult}
          mrWhiteGuessResult={mrWhiteGuessResult}
          waitingForMrWhiteGuess={waitingForMrWhiteGuess}
          onVote={handleVote}
          onMrWhiteGuess={handleMrWhiteGuess}
          onCloseRoom={handleCloseRoom}
          onEndGame={handleEndGame}
        />
      </>
    );
  }

  // Round end screen
  if (gameState === "round-end" && currentPlayer) {
    return (
      <>
        <ErrorToast message={error} />
        <UndercoverRoundEndScreen
          players={players}
          currentPlayerId={currentPlayer.id}
          result={roundResult}
          civilianWord={civilianWord}
          undercoverWord={undercoverWord}
          currentRound={currentRound}
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      <ErrorToast message={error} />
      <div className="text-center">
        <div className="text-6xl mb-4 animate-bounce">🎭</div>
        <p className="text-white text-xl">กำลังโหลด...</p>
      </div>
    </div>
  );
}

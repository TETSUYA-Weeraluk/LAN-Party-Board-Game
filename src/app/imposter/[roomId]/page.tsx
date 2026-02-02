"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSocket, getSessionId, clearSessionId } from "@/lib/socket";
import type { Player, RoomInfo } from "@/types/shared";
import type { ImposterPlayer, ImposterRole, ImposterVoteResultData, ImposterBlankGuessResultData, ImposterWinResult } from "@/game/imposter";
import { ImposterLobbyScreen, ImposterGameScreen, ImposterRoundEndScreen } from "@/game/imposter";
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

export default function ImposterRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [gameState, setGameState] = useState<GameState>("loading");
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [currentRoomName, setCurrentRoomName] = useState<string>("");

  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const currentPlayerIdRef = useRef<string | null>(null);
  const [players, setPlayers] = useState<ImposterPlayer[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [myRole, setMyRole] = useState<ImposterRole>("citizen");
  const [myWord, setMyWord] = useState<string | null>(null);
  const [alivePlayers, setAlivePlayers] = useState<ImposterPlayer[]>([]);
  const [spectators, setSpectators] = useState<ImposterPlayer[]>([]);
  const [isSpectator, setIsSpectator] = useState(false);

  const [voteResult, setVoteResult] = useState<ImposterVoteResultData | null>(null);
  const [blankGuessResult, setBlankGuessResult] = useState<ImposterBlankGuessResultData | null>(null);
  const [waitingForBlankGuess, setWaitingForBlankGuess] = useState(false);

  const [roundResult, setRoundResult] = useState<ImposterWinResult>("citizen-win");
  const [citizenWord, setCitizenWord] = useState<string>("");
  const [imposterWord, setImposterWord] = useState<string>("");
  const [currentRound, setCurrentRound] = useState(0);
  const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState<string | null>(null);
  const [currentTurnPlayerName, setCurrentTurnPlayerName] = useState<string>("");
  const [isYouGuessing, setIsYouGuessing] = useState(false);

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
        setPlayers((data.players as unknown) as ImposterPlayer[]);

        if (data.gameState === "playing") {
          setMyRole(data.myRole || "citizen");
          setMyWord(data.myWord || null);
          setAlivePlayers(data.alivePlayers || []);
          setSpectators(data.spectators || []);
          setCurrentRound(data.currentRound || 0);
          setCurrentTurnPlayerId(data.currentTurnPlayerId ?? null);
          setCurrentTurnPlayerName(data.currentTurnPlayerName || "");
          setWaitingForBlankGuess(data.waitingForBlankGuess || false);
          setIsYouGuessing(data.isYouGuessing || false);

          const currentPlayerData = data.alivePlayers?.find((p: ImposterPlayer) => p.id === data.player.id);
          setIsSpectator(!currentPlayerData);

          setGameState("playing");
        } else if (data.gameState === "round-end") {
          setCurrentRound(data.currentRound || 0);
          setCitizenWord(data.citizenWord || "");
          setImposterWord(data.imposterWord || "");
          setRoundResult(data.imposterRoundResult || "citizen-win");
          setGameState("round-end");
        } else {
          const allPlayers = (data.players as unknown) as ImposterPlayer[];
          setAlivePlayers(allPlayers.filter(p => !p.isSpectator));
          setSpectators(allPlayers.filter(p => p.isSpectator));
          setGameState("lobby");
        }
      } else {
        router.push(`/imposter/${data.roomId}`);
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
        setTimeout(() => router.push("/imposter"), 2000);
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

    socket.on("playersUpdate", (updatedPlayers) => {
      const imposterPlayers = (updatedPlayers as unknown) as ImposterPlayer[];
      setPlayers(imposterPlayers);
      setAlivePlayers(imposterPlayers.filter(p => !p.isSpectator));
      setSpectators(imposterPlayers.filter(p => p.isSpectator));
    });

    socket.on("imposterPlayersUpdate", (data) => {
      setAlivePlayers(data.alivePlayers);
      setSpectators(data.spectators);
      setPlayers([...data.alivePlayers, ...data.spectators]);
      if (currentPlayerIdRef.current) {
        const isSpec = data.spectators.some((p: ImposterPlayer) => p.id === currentPlayerIdRef.current);
        setIsSpectator(isSpec);
      }
    });

    socket.on("imposterGameStarted", (data) => {
      setMyRole(data.role);
      setMyWord(data.word);
      setAlivePlayers(data.alivePlayers);
      setSpectators(data.spectators);
      setCurrentRound(data.currentRound);
      setCurrentTurnPlayerId(data.currentTurnPlayerId);
      setCurrentTurnPlayerName(data.currentTurnPlayerName || "");
      setIsYouGuessing(false);
      setIsStarting(false);
      setVoteResult(null);
      setBlankGuessResult(null);
      setWaitingForBlankGuess(false);
      if (currentPlayerIdRef.current) {
        const isSpec = data.spectators.some((p: ImposterPlayer) => p.id === currentPlayerIdRef.current);
        setIsSpectator(isSpec);
      }
      setGameState("playing");
    });

    socket.on("imposterVoteResult", (data) => {
      setVoteResult(data);
      setWaitingForBlankGuess(data.isBlankGuessing);
      setIsYouGuessing(data.isYouGuessing ?? false);
      setAlivePlayers(prev => prev.filter(p => p.id !== data.votedPlayerId));
    });

    socket.on("imposterBlankGuessResult", (data) => {
      setBlankGuessResult(data);
      setWaitingForBlankGuess(false);
    });

    socket.on("imposterRoundEnded", (data) => {
      const updateRoundEndState = () => {
        setPlayers(data.players);
        setRoundResult(data.result);
        setCitizenWord(data.citizenWord);
        setImposterWord(data.imposterWord);
        setCurrentRound(data.currentRound);
        setIsStarting(false);
        setVoteResult(null);
        setBlankGuessResult(null);
        setWaitingForBlankGuess(false);
        setGameState("round-end");
      };
      if (data.result === "blank-win") {
        setTimeout(updateRoundEndState, 3000);
      } else {
        updateRoundEndState();
      }
    });

    socket.on("roomClosed", () => {
      clearSessionId();
      router.push("/imposter");
    });

    socket.on("leftRoom", () => {
      router.push("/imposter");
    });

    socket.on("kicked", (reason) => {
      setError(reason);
      clearSessionId();
      setTimeout(() => router.push("/imposter"), 2000);
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
      socket.off("imposterPlayersUpdate");
      socket.off("imposterGameStarted");
      socket.off("imposterVoteResult");
      socket.off("imposterBlankGuessResult");
      socket.off("imposterRoundEnded");
      socket.off("roomClosed");
      socket.off("leftRoom");
      socket.off("kicked");
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
    socket.emit("startImposterGame");
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
    socket.emit("imposterVote", { playerId });
  }, []);

  const handleBlankGuess = useCallback((guess: string) => {
    const socket = getSocket();
    socket.emit("imposterBlankGuess", { guess });
  }, []);

  const handleSkipBlankGuess = useCallback(() => {
    const socket = getSocket();
    socket.emit("imposterSkipBlankGuess");
  }, []);

  const handleEndGame = useCallback(() => {
    const socket = getSocket();
    socket.emit("endImposterGame");
  }, []);

  // Handle kick player
  const handleKickPlayer = useCallback((playerId: string) => {
    const socket = getSocket();
    socket.emit("kickPlayer", { playerId });
  }, []);

  // Handle next round
  const handleNextRound = useCallback(() => {
    const socket = getSocket();
    setIsStarting(true);
    socket.emit("startImposterGame");
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
          onBack={() => router.push("/imposter")}
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
        <ImposterLobbyScreen
          roomId={roomId}
          roomName={currentRoomName}
          players={players}
          currentPlayerId={currentPlayer.id}
          isHost={isHost}
          onStartGame={handleStartGame}
          onCloseRoom={handleCloseRoom}
          onLeaveRoom={handleLeaveRoom}
          onToggleSpectator={handleToggleSpectator}
          onKickPlayer={handleKickPlayer}
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
        <ImposterGameScreen
          currentPlayerId={currentPlayer.id}
          currentPlayerName={currentPlayer.name}
          myRole={myRole}
          myWord={myWord}
          alivePlayers={alivePlayers}
          spectators={spectators}
          isHost={isHost}
          isSpectator={isSpectator}
          currentRound={currentRound}
          currentTurnPlayerId={currentTurnPlayerId}
          currentTurnPlayerName={currentTurnPlayerName}
          voteResult={voteResult}
          blankGuessResult={blankGuessResult}
          waitingForBlankGuess={waitingForBlankGuess}
          isYouGuessing={isYouGuessing}
          onVote={handleVote}
          onBlankGuess={handleBlankGuess}
          onSkipBlankGuess={handleSkipBlankGuess}
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
        <ImposterRoundEndScreen
          players={players}
          currentPlayerId={currentPlayer.id}
          result={roundResult}
          citizenWord={citizenWord}
          imposterWord={imposterWord}
          currentRound={currentRound}
          isHost={isHost}
          onNextRound={handleNextRound}
          onCloseRoom={handleCloseRoom}
          onKickPlayer={handleKickPlayer}
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

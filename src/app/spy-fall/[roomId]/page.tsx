"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSocket, getSessionId, clearSessionId } from "@/lib/socket";
import type { Player, RoomInfo, SpyFallPlayer } from "@/types/game";
import SpyFallLobbyScreen from "@/components/spy-fall/SpyFallLobbyScreen";
import SpyFallGameScreen from "@/components/spy-fall/SpyFallGameScreen";
import SpyFallRoundEndScreen from "@/components/spy-fall/SpyFallRoundEndScreen";
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

export default function SpyFallRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  // Game state
  const [gameState, setGameState] = useState<GameState>("loading");
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [currentRoomName, setCurrentRoomName] = useState<string>("");

  // Player state
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<SpyFallPlayer[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Game state
  const [myLocation, setMyLocation] = useState<string | null>(null);
  const [isSpy, setIsSpy] = useState(false);
  const [timerDuration, setTimerDuration] = useState(0);
  const [timerStartedAt, setTimerStartedAt] = useState(0);
  const [spyId, setSpyId] = useState<string | null>(null);
  const [actualLocation, setActualLocation] = useState<string | null>(null);

  // Custom locations state
  const [customLocations, setCustomLocations] = useState<string[]>([]);

  // Round state
  const [currentRound, setCurrentRound] = useState(0);
  const [roundResult, setRoundResult] = useState<"spy-wins" | "spy-caught" | null>(null);

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
        setPlayers((data.players as unknown) as SpyFallPlayer[]);
        setCustomLocations(data.customLocations || []);

        if (data.gameState === "playing") {
          setMyLocation(data.myLocation || null);
          setIsSpy(data.isSpy || false);
          setTimerDuration(data.timerDuration || 0);
          setTimerStartedAt(data.timerStartedAt || 0);
          setCurrentRound(data.currentRound || 0);
          setGameState("playing");
        } else if (data.gameState === "round-end") {
          setCurrentRound(data.currentRound || 0);
          setSpyId(data.spyId || null);
          setActualLocation(data.actualLocation || null);
          setRoundResult(data.roundResult || null);
          setGameState("round-end");
        } else {
          setGameState("lobby");
        }
      } else {
        router.push(`/spy-fall/${data.roomId}`);
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
        setTimeout(() => router.push("/spy-fall"), 2000);
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
      // Cast to SpyFallPlayer[] for spy-fall rooms
      const spyFallPlayers = (updatedPlayers as unknown) as SpyFallPlayer[];
      setPlayers(spyFallPlayers);
    });

    // Custom locations update
    socket.on("locationsUpdate", (locations: string[]) => {
      setCustomLocations(locations);
    });

    // Spy Fall game started
    socket.on("spyFallGameStarted", (data) => {
      setMyLocation(data.location);
      setIsSpy(data.isSpy);
      setTimerDuration(data.timerDuration);
      setTimerStartedAt(data.timerStartedAt);
      setCurrentRound(data.currentRound);
      setIsStarting(false);
      setGameState("playing");
    });

    // Spy Fall round ended
    socket.on("spyFallRoundEnded", (data) => {
      setPlayers(data.players as SpyFallPlayer[]);
      setSpyId(data.spyId);
      setActualLocation(data.actualLocation);
      setRoundResult(data.result);
      setCurrentRound(data.currentRound);
      setGameState("round-end");
    });

    // Room closed
    socket.on("roomClosed", () => {
      clearSessionId();
      router.push("/spy-fall");
    });

    // Left room
    socket.on("leftRoom", () => {
      router.push("/spy-fall");
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
      socket.off("locationsUpdate");
      socket.off("spyFallGameStarted");
      socket.off("spyFallRoundEnded");
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
    socket.emit("startSpyFallGame");
  }, []);

  // Handle close room
  const handleCloseRoom = useCallback(() => {
    const socket = getSocket();
    socket.emit("closeRoom");
  }, []);

  // Handle add location
  const handleAddLocation = useCallback((location: string) => {
    const socket = getSocket();
    socket.emit("addLocation", { location });
  }, []);

  // Handle remove location
  const handleRemoveLocation = useCallback((location: string) => {
    const socket = getSocket();
    socket.emit("removeLocation", { location });
  }, []);

  // Handle spy caught
  const handleSpyCaught = useCallback(() => {
    const socket = getSocket();
    socket.emit("spyCaught");
  }, []);

  // Handle spy wins
  const handleSpyWins = useCallback(() => {
    const socket = getSocket();
    socket.emit("spyWins");
  }, []);

  // Handle next round
  const handleNextRound = useCallback(() => {
    const socket = getSocket();
    setIsStarting(true);
    socket.emit("startSpyFallGame");
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-cyan-900 to-blue-900">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🕵️</div>
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
          onBack={() => router.push("/spy-fall")}
          accentColor="cyan"
        />
      </>
    );
  }

  // Lobby screen
  if (gameState === "lobby" && currentPlayer) {
    return (
      <>
        <ErrorToast message={error} />
        <SpyFallLobbyScreen
          roomId={roomId}
          roomName={currentRoomName}
          players={players}
          currentPlayerId={currentPlayer.id}
          isHost={isHost}
          customLocations={customLocations}
          onStartGame={handleStartGame}
          onCloseRoom={handleCloseRoom}
          onLeaveRoom={handleLeaveRoom}
          onAddLocation={handleAddLocation}
          onRemoveLocation={handleRemoveLocation}
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
        <SpyFallGameScreen
          currentPlayerName={currentPlayer.name}
          players={players}
          myLocation={myLocation}
          isSpy={isSpy}
          timerDuration={timerDuration}
          timerStartedAt={timerStartedAt}
          isHost={isHost}
          currentRound={currentRound}
          customLocations={customLocations}
          onCloseRoom={handleCloseRoom}
          onSpyCaught={handleSpyCaught}
          onSpyWins={handleSpyWins}
        />
      </>
    );
  }

  // Round end screen
  if (gameState === "round-end" && currentPlayer) {
    return (
      <>
        <ErrorToast message={error} />
        <SpyFallRoundEndScreen
          players={players}
          currentPlayerId={currentPlayer.id}
          spyId={spyId}
          actualLocation={actualLocation}
          roundResult={roundResult}
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-cyan-900 to-blue-900">
      <ErrorToast message={error} />
      <div className="text-center">
        <div className="text-6xl mb-4 animate-bounce">🕵️</div>
        <p className="text-white text-xl">กำลังโหลด...</p>
      </div>
    </div>
  );
}

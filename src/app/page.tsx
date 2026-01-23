"use client";

import { useEffect, useState, useCallback } from "react";
import { getSocket, getSessionId, clearSessionId } from "@/lib/socket";
import type { Player, PlayerWithWord, GameState, RoomInfo } from "@/types/game";
import RoomList from "@/components/RoomList";
import CreateRoomForm from "@/components/CreateRoomForm";
import JoinRoomForm from "@/components/JoinRoomForm";
import LobbyScreen from "@/components/LobbyScreen";
import GameScreen from "@/components/GameScreen";
import RoundEndScreen from "@/components/RoundEndScreen";
import RulesButton from "@/components/RulesButton";

// Error toast component (defined outside render)
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

export default function Home() {
  // Room state
  const [gameState, setGameState] = useState<GameState>("room-list");
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<RoomInfo | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
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

  // Socket connection and event handlers
  useEffect(() => {
    const socket = getSocket();
    const sessionId = getSessionId();

    // Try to rejoin first when connecting
    const handleConnect = () => {
      console.log("Socket connected, attempting to rejoin with session:", sessionId);
      socket.emit("rejoin", { sessionId });
    };

    // If socket is already connected, try to rejoin
    if (socket.connected) {
      handleConnect();
    }

    socket.on("connect", handleConnect);

    // Room list received
    socket.on("roomList", (data) => {
      setRooms(data.rooms);
      // Only set to room-list if we're not already in a room
      setGameState((current) => {
        if (current === "lobby" || current === "playing" || current === "round-end") {
          return current;
        }
        return "room-list";
      });
    });

    // Rejoin success - restore full game state
    socket.on("rejoinSuccess", (data) => {
      console.log("Rejoin successful!", data);
      setCurrentRoomId(data.roomId);
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
    });

    // Rejoin failed - show room list
    socket.on("rejoinFailed", (reason) => {
      console.log("Rejoin failed:", reason);
      // Room list will be sent separately
    });

    // Room joined
    socket.on("roomJoined", ({ roomId, roomName, player, isHost: hostStatus }) => {
      setCurrentRoomId(roomId);
      setCurrentRoomName(roomName);
      setCurrentPlayer(player);
      setIsHost(hostStatus);
      setSelectedRoom(null);
      setGameState("lobby");
    });

    // Left room
    socket.on("leftRoom", () => {
      setCurrentRoomId(null);
      setCurrentRoomName("");
      setCurrentPlayer(null);
      setPlayers([]);
      setIsHost(false);
      setGameState("room-list");
    });

    // Players update
    socket.on("playersUpdate", (updatedPlayers) => {
      setPlayers(updatedPlayers);
      setAllPlayers(updatedPlayers);
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

      // Update current player's hasAnswered state
      setCurrentPlayer((prev) =>
        prev ? { ...prev, hasAnswered: false, answerOrder: undefined } : null
      );

      // Update allPlayers - reset hasAnswered for the new round
      setAllPlayers((prev) =>
        prev.map((p) => ({
          ...p,
          hasAnswered: false,
          answerOrder: undefined,
        }))
      );

      setGameState("playing");
    });

    // Player answered (someone got it right)
    socket.on("playerAnswered", (data) => {
      // Update otherPlayers
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

      // Update allPlayers
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

      // Update current player if it's them
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

    // Round ended
    socket.on("roundEnded", (data) => {
      setAllPlayers(data.players);
      setPlayedCategories(data.playedCategories);
      setCurrentRound(data.currentRound);

      // Update current player from the data
      setCurrentPlayer((prev) => {
        if (!prev) return null;
        const myData = data.players.find((p) => p.id === prev.id);
        return myData || prev;
      });

      setGameState("round-end");
    });

    // Room closed
    socket.on("roomClosed", () => {
      clearSessionId(); // Clear session when room is closed
      setCurrentRoomId(null);
      setCurrentRoomName("");
      setGameState("room-list");
      setCurrentPlayer(null);
      setPlayers([]);
      setAllPlayers([]);
      setIsHost(false);
      setCategory("");
      setOtherPlayers([]);
      setMyRevealedWord(null);
      setCurrentRound(0);
      setPlayedCategories([]);
      setSelectedRoom(null);
      // Request fresh room list
      socket.emit("getRoomList");
    });

    // Word revealed
    socket.on("wordRevealed", (word) => {
      setMyRevealedWord(word);
    });

    // Error handling
    socket.on("error", (message) => {
      setError(message);
      setIsStarting(false);
      setTimeout(() => setError(null), 3000);
    });

    // Cleanup
    return () => {
      socket.off("connect");
      socket.off("roomList");
      socket.off("rejoinSuccess");
      socket.off("rejoinFailed");
      socket.off("roomJoined");
      socket.off("leftRoom");
      socket.off("playersUpdate");
      socket.off("gameStarted");
      socket.off("playerAnswered");
      socket.off("roundEnded");
      socket.off("roomClosed");
      socket.off("wordRevealed");
      socket.off("error");
    };
  }, []);

  // Handle refresh room list
  const handleRefreshRoomList = useCallback(() => {
    const socket = getSocket();
    socket.emit("getRoomList");
  }, []);

  // Handle select room
  const handleSelectRoom = useCallback((room: RoomInfo) => {
    setSelectedRoom(room);
    setGameState("joining-room");
  }, []);

  // Handle go to create room
  const handleGoToCreateRoom = useCallback(() => {
    setGameState("creating-room");
  }, []);

  // Handle back to room list
  const handleBackToRoomList = useCallback(() => {
    setSelectedRoom(null);
    setGameState("room-list");
    // Refresh room list
    const socket = getSocket();
    socket.emit("getRoomList");
  }, []);

  // Handle create room
  const handleCreateRoom = useCallback(
    (roomName: string, password: string | null, playerName: string) => {
      const socket = getSocket();
      const sessionId = getSessionId();
      socket.emit("createRoom", { roomName, password, playerName, sessionId });
    },
    []
  );

  // Handle join room
  const handleJoinRoom = useCallback(
    (roomId: string, password: string | null, playerName: string) => {
      const socket = getSocket();
      const sessionId = getSessionId();
      socket.emit("joinRoom", { roomId, password, playerName, sessionId });
    },
    []
  );

  // Handle leave room (go back to room list from lobby)
  const handleLeaveRoom = useCallback(() => {
    if (!currentRoomId) return;
    const socket = getSocket();
    socket.emit("leaveRoom", { roomId: currentRoomId });
  }, [currentRoomId]);

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

  // Room list screen
  if (gameState === "room-list") {
    return (
      <>
        <RulesButton />
        <ErrorToast message={error} />
        <RoomList
          rooms={rooms}
          onCreateRoom={handleGoToCreateRoom}
          onSelectRoom={handleSelectRoom}
          onRefresh={handleRefreshRoomList}
        />
      </>
    );
  }

  // Create room screen
  if (gameState === "creating-room") {
    return (
      <>
        <RulesButton />
        <ErrorToast message={error} />
        <CreateRoomForm onSubmit={handleCreateRoom} onBack={handleBackToRoomList} />
      </>
    );
  }

  // Join room screen
  if (gameState === "joining-room" && selectedRoom) {
    return (
      <>
        <RulesButton />
        <ErrorToast message={error} />
        <JoinRoomForm
          room={selectedRoom}
          onSubmit={handleJoinRoom}
          onBack={handleBackToRoomList}
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
          myRevealedWord={myRevealedWord}
          myHasAnswered={currentPlayer.hasAnswered}
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

  // Fallback / Loading
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      <RulesButton />
      <div className="text-center">
        <div className="text-6xl mb-4 animate-bounce">🎭</div>
        <p className="text-white text-xl">กำลังโหลด...</p>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSocket, getSessionId } from "@/lib/socket";
import type { RoomInfo } from "@/types/game";
import RoomList from "@/components/RoomList";
import CreateRoomForm from "@/components/CreateRoomForm";
import JoinRoomForm from "@/components/JoinRoomForm";
import RulesButton from "@/components/RulesButton";
import Link from "next/link";

type PageState = "room-list" | "creating-room" | "joining-room";

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

export default function WhoAmIRoomListPage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>("room-list");
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<RoomInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = getSocket();
    const sessionId = getSessionId();

    // Try to rejoin first when connecting
    const handleConnect = () => {
      console.log("Socket connected, attempting to rejoin with session:", sessionId);
      socket.emit("rejoin", { sessionId });
    };

    if (socket.connected) {
      handleConnect();
    }

    socket.on("connect", handleConnect);

    // Room list received - filter for who-am-i only
    socket.on("roomList", (data) => {
      const whoAmIRooms = data.rooms.filter(r => r.gameType === "who-am-i");
      setRooms(whoAmIRooms);
    });

    // Rejoin success - redirect to room
    socket.on("rejoinSuccess", (data) => {
      if (data.gameType === "who-am-i") {
        router.push(`/who-am-i/${data.roomId}`);
      }
    });

    // Rejoin failed - stay on room list
    socket.on("rejoinFailed", () => {
      socket.emit("getRoomList");
    });

    // Room joined - redirect to room page
    socket.on("roomJoined", ({ roomId, gameType }) => {
      if (gameType === "who-am-i") {
        router.push(`/who-am-i/${roomId}`);
      }
    });

    // Error handling
    socket.on("error", (message) => {
      setError(message);
      setTimeout(() => setError(null), 3000);
    });

    // Get room list on mount
    socket.emit("getRoomList");

    return () => {
      socket.off("connect", handleConnect);
      socket.off("roomList");
      socket.off("rejoinSuccess");
      socket.off("rejoinFailed");
      socket.off("roomJoined");
      socket.off("error");
    };
  }, [router]);

  const handleRefreshRoomList = useCallback(() => {
    const socket = getSocket();
    socket.emit("getRoomList");
  }, []);

  const handleSelectRoom = useCallback((room: RoomInfo) => {
    setSelectedRoom(room);
    setPageState("joining-room");
  }, []);

  const handleGoToCreateRoom = useCallback(() => {
    setPageState("creating-room");
  }, []);

  const handleBackToRoomList = useCallback(() => {
    setSelectedRoom(null);
    setPageState("room-list");
    const socket = getSocket();
    socket.emit("getRoomList");
  }, []);

  const handleCreateRoom = useCallback(
    (roomName: string, password: string | null, playerName: string) => {
      const socket = getSocket();
      const sessionId = getSessionId();
      socket.emit("createRoom", { 
        roomName, 
        password, 
        playerName, 
        sessionId,
        gameType: "who-am-i"
      });
    },
    []
  );

  const handleJoinRoom = useCallback(
    (roomId: string, password: string | null, playerName: string) => {
      const socket = getSocket();
      const sessionId = getSessionId();
      socket.emit("joinRoom", { roomId, password, playerName, sessionId });
    },
    []
  );

  // Room list screen
  if (pageState === "room-list") {
    return (
      <>
        <RulesButton />
        <ErrorToast message={error} />
        {/* Back to home button */}
        <Link 
          href="/" 
          className="fixed top-4 left-4 z-40 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-lg rounded-xl text-white transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          กลับหน้าหลัก
        </Link>
        <RoomList
          rooms={rooms}
          onCreateRoom={handleGoToCreateRoom}
          onSelectRoom={handleSelectRoom}
          onRefresh={handleRefreshRoomList}
          gameTitle="🎭 Who Am I?"
        />
      </>
    );
  }

  // Create room screen
  if (pageState === "creating-room") {
    return (
      <>
        <RulesButton />
        <ErrorToast message={error} />
        <CreateRoomForm onSubmit={handleCreateRoom} onBack={handleBackToRoomList} />
      </>
    );
  }

  // Join room screen
  if (pageState === "joining-room" && selectedRoom) {
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

  // Loading
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

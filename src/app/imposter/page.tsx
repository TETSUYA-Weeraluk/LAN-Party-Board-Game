"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSocket, getSessionId } from "@/lib/socket";
import type { RoomInfo } from "@/types/shared";
import RoomList from "@/components/RoomList";
import CreateRoomForm from "@/components/CreateRoomForm";
import JoinRoomForm from "@/components/JoinRoomForm";
import Link from "next/link";

type PageState = "room-list" | "creating-room" | "joining-room";

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

export default function ImposterRoomListPage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>("room-list");
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<RoomInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasAttemptedRejoin = useRef(false);

  useEffect(() => {
    const socket = getSocket();
    const sessionId = getSessionId();

    const handleConnect = () => {
      if (hasAttemptedRejoin.current) return;
      hasAttemptedRejoin.current = true;
      socket.emit("rejoin", { sessionId });
    };

    if (socket.connected) {
      handleConnect();
    }

    socket.on("connect", handleConnect);

    socket.on("roomList", (data) => {
      const imposterRooms = data.rooms.filter(
        (r) => r.gameType === "imposter"
      );
      setRooms(imposterRooms);
    });

    socket.on("rejoinSuccess", (data) => {
      if (data.gameType === "imposter") {
        if (window.location.pathname !== `/imposter/${data.roomId}`) {
          router.push(`/imposter/${data.roomId}`);
        }
      }
    });

    socket.on("rejoinFailed", () => {
      socket.emit("getRoomList");
    });

    socket.on("roomJoined", ({ roomId, gameType }) => {
      if (gameType === "imposter") {
        if (window.location.pathname !== `/imposter/${roomId}`) {
          router.push(`/imposter/${roomId}`);
        }
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
        gameType: "imposter",
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
        <ErrorToast message={error} />
        {/* Back to home button */}
        <Link
          href="/"
          className="fixed top-4 left-4 z-40 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-lg rounded-xl text-white transition-colors flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          กลับหน้าหลัก
        </Link>
        <RoomList
          rooms={rooms}
          onCreateRoom={handleGoToCreateRoom}
          onSelectRoom={handleSelectRoom}
          onRefresh={handleRefreshRoomList}
          gameTitle="🎭 The Imposter"
          accentColor="purple"
        />
      </>
    );
  }

  // Create room screen
  if (pageState === "creating-room") {
    return (
      <>
        <ErrorToast message={error} />
        <CreateRoomForm
          onSubmit={handleCreateRoom}
          onBack={handleBackToRoomList}
          accentColor="purple"
        />
      </>
    );
  }

  // Join room screen
  if (pageState === "joining-room" && selectedRoom) {
    return (
      <>
        <ErrorToast message={error} />
        <JoinRoomForm
          room={selectedRoom}
          onSubmit={handleJoinRoom}
          onBack={handleBackToRoomList}
          accentColor="purple"
        />
      </>
    );
  }

  // Loading
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-bounce">🎭</div>
        <p className="text-white text-xl">กำลังโหลด...</p>
      </div>
    </div>
  );
}

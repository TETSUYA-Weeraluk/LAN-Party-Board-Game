"use client";

import { useEffect, useState } from "react";
import type { Player } from "../types";
import PlayerCard from "./PlayerCard";
import CategorySelector from "./CategorySelector";

interface LobbyScreenProps {
  roomId: string;
  roomName: string;
  players: Player[];
  currentPlayerId: string;
  isHost: boolean;
  onStartGame: (category: string | null, timerMinutes: number) => void;
  onCloseRoom: () => void;
  onLeaveRoom: () => void;
  isStarting: boolean;
}

export default function LobbyScreen({
  roomId,
  roomName,
  players,
  currentPlayerId,
  isHost,
  onStartGame,
  onCloseRoom,
  onLeaveRoom,
  isStarting,
}: LobbyScreenProps) {
  const [showIpInfo, setShowIpInfo] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");

  useEffect(() => {
    // Get window location for sharing with room ID
    if (typeof window !== "undefined") {
      const baseUrl = window.location.origin;
      setShareUrl(`${baseUrl}/guess-me/${roomId}`);
    }
  }, [roomId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎭 Who Am I?</h1>
          <p className="text-purple-200">ห้อง: <span className="text-white font-semibold">{roomName}</span></p>
          <p className="text-purple-300 text-sm mt-1">รหัสห้อง: <code className="bg-white/10 px-2 py-0.5 rounded">{roomId}</code></p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Players list */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                👥 ผู้เล่น ({players.length})
              </h2>
              {isHost && (
                <button
                  onClick={() => setShowIpInfo(!showIpInfo)}
                  className="text-sm text-purple-300 hover:text-white transition-colors"
                >
                  📤 แชร์ลิงก์
                </button>
              )}
            </div>

            {/* Share info */}
            {showIpInfo && (
              <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-xs text-purple-300 mb-2">
                  ให้เพื่อนเข้า URL นี้ (ต้องอยู่ใน WiFi เดียวกัน)
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-black/30 rounded text-pink-300 text-sm break-all">
                    {shareUrl}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl);
                    }}
                    className="px-3 py-2 bg-pink-500 text-white rounded-lg text-sm hover:bg-pink-600 transition-colors"
                  >
                    คัดลอก
                  </button>
                </div>
              </div>
            )}

            {/* Player list */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {players.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  isCurrentUser={player.id === currentPlayerId}
                />
              ))}
            </div>

            {players.length < 2 && (
              <div className="mt-4 p-4 bg-yellow-500/20 rounded-xl border border-yellow-500/30">
                <p className="text-yellow-200 text-sm text-center">
                  ⏳ รอผู้เล่นอีกอย่างน้อย {2 - players.length} คน
                </p>
              </div>
            )}
          </div>

          {/* Category selector (host only) / Waiting message */}
          {isHost ? (
            <CategorySelector
              onStart={onStartGame}
              playerCount={players.length}
              isLoading={isStarting}
            />
          ) : (
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 flex flex-col items-center justify-center">
              <div className="text-6xl mb-4">⏳</div>
              <h2 className="text-xl font-bold text-white mb-2">
                รอ Host เริ่มเกม
              </h2>
              <p className="text-purple-300 text-center">
                Host กำลังเลือกหมวดหมู่และตั้งค่าเกม
              </p>
            </div>
          )}
        </div>

        {/* Room actions */}
        <div className="mt-6 flex justify-center gap-4">
          {!isHost && (
            <button
              onClick={onLeaveRoom}
              className="px-6 py-2 bg-white/10 border border-white/30 text-white rounded-xl hover:bg-white/20 transition-colors"
            >
              ← ออกจากห้อง
            </button>
          )}
          {isHost && (
            <button
              onClick={onCloseRoom}
              className="px-6 py-2 bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl hover:bg-red-500/30 transition-colors"
            >
              🚪 ปิดห้อง
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

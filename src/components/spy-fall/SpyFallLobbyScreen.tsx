"use client";

import { useEffect, useState } from "react";
import type { SpyFallPlayer } from "@/types/game";
import { SPYFALL_LOCATIONS } from "@/constant";

interface SpyFallLobbyScreenProps {
  roomId: string;
  roomName: string;
  players: SpyFallPlayer[];
  currentPlayerId: string;
  isHost: boolean;
  customLocations: string[];
  onStartGame: () => void;
  onCloseRoom: () => void;
  onLeaveRoom: () => void;
  onAddLocation: (location: string) => void;
  onRemoveLocation: (location: string) => void;
  isStarting: boolean;
}

export default function SpyFallLobbyScreen({
  roomId,
  roomName,
  players,
  currentPlayerId,
  isHost,
  customLocations,
  onStartGame,
  onCloseRoom,
  onLeaveRoom,
  onAddLocation,
  onRemoveLocation,
  isStarting,
}: SpyFallLobbyScreenProps) {
  const [showIpInfo, setShowIpInfo] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [newLocation, setNewLocation] = useState("");
  const [showLocationManager, setShowLocationManager] = useState(false);

  // All available locations (preset + custom)
  const allLocations = [...SPYFALL_LOCATIONS, ...customLocations];
  const timerMinutes = players.length; // Timer = number of players * 1 minute

  useEffect(() => {
    if (typeof window !== "undefined") {
      const baseUrl = window.location.origin;
      setShareUrl(`${baseUrl}/spy-fall/${roomId}`);
    }
  }, [roomId]);

  const handleAddLocation = () => {
    if (newLocation.trim() && !allLocations.includes(newLocation.trim())) {
      onAddLocation(newLocation.trim());
      setNewLocation("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-blue-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-white mb-2">🕵️ Spy Fall</h1>
          <p className="text-cyan-200">ห้อง: <span className="text-white font-semibold">{roomName}</span></p>
          <p className="text-cyan-300 text-sm mt-1">รหัสห้อง: <code className="bg-white/10 px-2 py-0.5 rounded">{roomId}</code></p>
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
                  className="text-sm text-cyan-300 hover:text-white transition-colors"
                >
                  📤 แชร์ลิงก์
                </button>
              )}
            </div>

            {/* Share info */}
            {showIpInfo && (
              <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-xs text-cyan-300 mb-2">
                  ให้เพื่อนเข้า URL นี้ (ต้องอยู่ใน WiFi เดียวกัน)
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-black/30 rounded text-cyan-300 text-sm break-all">
                    {shareUrl}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(shareUrl)}
                    className="px-3 py-2 bg-cyan-500 text-white rounded-lg text-sm hover:bg-cyan-600 transition-colors"
                  >
                    คัดลอก
                  </button>
                </div>
              </div>
            )}

            {/* Player list */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`p-3 rounded-xl border transition-all ${
                    player.id === currentPlayerId
                      ? "bg-cyan-500/20 border-cyan-500/50"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold">
                        {player.name}
                        {player.id === currentPlayerId && (
                          <span className="text-cyan-400 ml-2">(คุณ)</span>
                        )}
                        {player.isHost && (
                          <span className="text-yellow-400 ml-2">👑</span>
                        )}
                      </p>
                      <p className="text-xs text-cyan-300">
                        ชนะ: {player.wins} รอบ • คะแนน: {player.score}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {players.length < 3 && (
              <div className="mt-4 p-4 bg-yellow-500/20 rounded-xl border border-yellow-500/30">
                <p className="text-yellow-200 text-sm text-center">
                  ⏳ รอผู้เล่นอีกอย่างน้อย {3 - players.length} คน
                </p>
              </div>
            )}
          </div>

          {/* Game settings / Location manager */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">
              ⚙️ ตั้งค่าเกม
            </h2>

            {/* Timer info */}
            <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-cyan-200">⏱️ เวลาต่อรอบ</span>
                <span className="text-white font-bold">{timerMinutes} นาที</span>
              </div>
              <p className="text-xs text-cyan-300 mt-1">
                (จำนวนผู้เล่น × 1 นาที)
              </p>
            </div>

            {/* Location manager toggle */}
            <button
              onClick={() => setShowLocationManager(!showLocationManager)}
              className="w-full mb-4 py-3 bg-white/10 text-white rounded-xl border border-white/20 hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
            >
              📍 จัดการสถานที่ ({allLocations.length})
              <span className="text-cyan-300">{showLocationManager ? "▲" : "▼"}</span>
            </button>

            {/* Location manager */}
            {showLocationManager && (
              <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="เพิ่มสถานที่ใหม่..."
                    className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    maxLength={30}
                    onKeyDown={(e) => e.key === "Enter" && handleAddLocation()}
                  />
                  <button
                    onClick={handleAddLocation}
                    disabled={!newLocation.trim()}
                    className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    เพิ่ม
                  </button>
                </div>

                {/* Custom locations */}
                {customLocations.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-cyan-300 mb-2">สถานที่ที่เพิ่มเอง:</p>
                    <div className="flex flex-wrap gap-2">
                      {customLocations.map((loc) => (
                        <span
                          key={loc}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-500/20 text-cyan-200 rounded-lg text-sm"
                        >
                          {loc}
                          <button
                            onClick={() => onRemoveLocation(loc)}
                            className="text-cyan-400 hover:text-red-400"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preset locations */}
                <div>
                  <p className="text-xs text-cyan-300 mb-2">สถานที่ทั้งหมด ({SPYFALL_LOCATIONS.length}):</p>
                  <div className="max-h-32 overflow-y-auto">
                    <div className="flex flex-wrap gap-1">
                      {SPYFALL_LOCATIONS.map((loc) => (
                        <span
                          key={loc}
                          className="px-2 py-0.5 bg-white/10 text-white/70 rounded text-xs"
                        >
                          {loc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Start button (host only) */}
            {isHost ? (
              <button
                onClick={onStartGame}
                disabled={players.length < 3 || isStarting}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isStarting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    กำลังเริ่ม...
                  </span>
                ) : (
                  "🎮 เริ่มเกม!"
                )}
              </button>
            ) : (
              <div className="text-center py-4">
                <div className="text-4xl mb-2">⏳</div>
                <p className="text-cyan-200">รอ Host เริ่มเกม</p>
              </div>
            )}
          </div>
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

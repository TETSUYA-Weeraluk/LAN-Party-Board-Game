"use client";

import { useEffect, useState } from "react";
import type { UndercoverPlayer } from "../types";

interface UndercoverLobbyScreenProps {
  roomId: string;
  roomName: string;
  players: UndercoverPlayer[];
  currentPlayerId: string;
  isHost: boolean;
  onStartGame: () => void;
  onCloseRoom: () => void;
  onLeaveRoom: () => void;
  onToggleSpectator: (isSpectator: boolean) => void;
  isStarting: boolean;
}

// Role distribution table
const ROLE_DISTRIBUTION: Record<number, { civilians: number; undercover: number; mrwhite: number }> = {
  3: { civilians: 2, undercover: 1, mrwhite: 0 },
  4: { civilians: 2, undercover: 1, mrwhite: 1 },
  5: { civilians: 3, undercover: 1, mrwhite: 1 },
  6: { civilians: 4, undercover: 1, mrwhite: 1 },
  7: { civilians: 5, undercover: 1, mrwhite: 1 },
  8: { civilians: 5, undercover: 2, mrwhite: 1 },
  9: { civilians: 6, undercover: 2, mrwhite: 1 },
  10: { civilians: 7, undercover: 2, mrwhite: 1 },
};

export default function UndercoverLobbyScreen({
  roomId,
  roomName,
  players,
  currentPlayerId,
  isHost,
  onStartGame,
  onCloseRoom,
  onLeaveRoom,
  onToggleSpectator,
  isStarting,
}: UndercoverLobbyScreenProps) {
  const [showIpInfo, setShowIpInfo] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");

  const activePlayers = players.filter(p => !p.isSpectator);
  const spectators = players.filter(p => p.isSpectator);
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const isCurrentPlayerSpectator = currentPlayer?.isSpectator ?? false;

  const distribution = ROLE_DISTRIBUTION[activePlayers.length];
  const canStart = activePlayers.length >= 3 && activePlayers.length <= 10;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const baseUrl = window.location.origin;
      setTimeout(() => {
        setShareUrl(`${baseUrl}/undercover/${roomId}`);
      }, 0);
    }
  }, [roomId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎭 Undercover</h1>
          <p className="text-purple-200">ห้อง: <span className="text-white font-semibold">{roomName}</span></p>
          <p className="text-purple-300 text-sm mt-1">รหัสห้อง: <code className="bg-white/10 px-2 py-0.5 rounded">{roomId}</code></p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Players list */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                👥 ผู้เล่น ({activePlayers.length})
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
                  <code className="flex-1 p-2 bg-black/30 rounded text-purple-300 text-sm break-all">
                    {shareUrl}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(shareUrl)}
                    className="px-3 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 transition-colors"
                  >
                    คัดลอก
                  </button>
                </div>
              </div>
            )}

            {/* Player list */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {activePlayers.map((player) => (
                <div
                  key={player.id}
                  className={`p-3 rounded-xl border transition-all ${
                    player.id === currentPlayerId
                      ? "bg-purple-500/20 border-purple-500/50"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold">
                        {player.name}
                        {player.id === currentPlayerId && (
                          <span className="text-purple-400 ml-2">(คุณ)</span>
                        )}
                        {player.isHost && (
                          <span className="text-yellow-400 ml-2">👑</span>
                        )}
                      </p>
                      <p className="text-xs text-purple-300">
                        ชนะ: {player.wins} รอบ • คะแนน: {player.score}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Spectators */}
            {spectators.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-purple-300 mb-2">👀 ผู้ดู ({spectators.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {spectators.map((player) => (
                    <span
                      key={player.id}
                      className={`px-3 py-1 rounded-full text-sm ${
                        player.id === currentPlayerId
                          ? "bg-purple-500/30 text-purple-200"
                          : "bg-white/10 text-white/70"
                      }`}
                    >
                      {player.name}
                      {player.id === currentPlayerId && " (คุณ)"}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Toggle spectator button */}
            <div className="mt-4">
              <button
                onClick={() => onToggleSpectator(!isCurrentPlayerSpectator)}
                className={`w-full py-2 rounded-xl border transition-colors ${
                  isCurrentPlayerSpectator
                    ? "bg-purple-500/20 border-purple-500/50 text-purple-300 hover:bg-purple-500/30"
                    : "bg-white/10 border-white/20 text-white/70 hover:bg-white/20"
                }`}
              >
                {isCurrentPlayerSpectator ? "🎮 เปลี่ยนเป็นผู้เล่น" : "👀 เปลี่ยนเป็นผู้ดู"}
              </button>
            </div>

            {activePlayers.length < 3 && (
              <div className="mt-4 p-4 bg-yellow-500/20 rounded-xl border border-yellow-500/30">
                <p className="text-yellow-200 text-sm text-center">
                  ⏳ รอผู้เล่นอีกอย่างน้อย {3 - activePlayers.length} คน
                </p>
              </div>
            )}
          </div>

          {/* Game settings */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">
              ⚙️ กฎการเล่น
            </h2>

            {/* Role distribution info */}
            <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
              <h3 className="text-white font-semibold mb-2">📊 การแบ่ง Role ({activePlayers.length} คน)</h3>
              {distribution ? (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <p className="text-blue-300 text-xs">พลเรือน</p>
                    <p className="text-white font-bold text-lg">{distribution.civilians}</p>
                  </div>
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <p className="text-red-300 text-xs">Undercover</p>
                    <p className="text-white font-bold text-lg">{distribution.undercover}</p>
                  </div>
                  <div className="p-2 bg-gray-500/20 rounded-lg">
                    <p className="text-gray-300 text-xs">Mr.White</p>
                    <p className="text-white font-bold text-lg">{distribution.mrwhite}</p>
                  </div>
                </div>
              ) : (
                <p className="text-purple-300 text-sm">รอผู้เล่น 3-10 คน</p>
              )}
            </div>

            {/* Rules */}
            <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
              <h3 className="text-white font-semibold mb-2">📖 วิธีเล่น</h3>
              <ul className="text-purple-200/80 text-sm space-y-1">
                <li>• <span className="text-blue-300">พลเรือน</span>: ได้คำเหมือนกัน หา Undercover/Mr.White</li>
                <li>• <span className="text-red-300">Undercover</span>: ได้คำคล้ายๆ พยายามไม่โดนจับ</li>
                <li>• <span className="text-gray-300">Mr.White</span>: ไม่รู้คำ ถ้าโดนจับให้ทายคำ</li>
              </ul>
            </div>

            {/* Win conditions */}
            <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
              <h3 className="text-white font-semibold mb-2">🏆 เงื่อนไขชนะ</h3>
              <ul className="text-purple-200/80 text-sm space-y-1">
                <li>• <span className="text-blue-300">พลเรือน</span>: โหวต Undercover และ Mr.White ออกหมด</li>
                <li>• <span className="text-red-300">Undercover</span>: มีจำนวน = พลเรือนที่เหลือ</li>
                <li>• <span className="text-gray-300">Mr.White</span>: ทายคำของพลเรือนถูก</li>
              </ul>
            </div>

            {/* Start button (host only) */}
            {isHost ? (
              <button
                onClick={onStartGame}
                disabled={!canStart || isStarting}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-xl hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
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
                <p className="text-purple-200">รอ Host เริ่มเกม</p>
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

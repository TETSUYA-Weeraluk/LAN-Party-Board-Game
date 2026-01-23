"use client";

import { useState } from "react";
import type { SpyFallPlayer } from "@/types/game";

interface SpyFallRoundEndScreenProps {
  players: SpyFallPlayer[];
  currentPlayerId: string;
  spyId: string | null;
  actualLocation: string | null;
  roundResult: "spy-wins" | "spy-caught" | null;
  currentRound: number;
  isHost: boolean;
  onNextRound: () => void;
  onCloseRoom: () => void;
  isStarting: boolean;
}

export default function SpyFallRoundEndScreen({
  players,
  currentPlayerId,
  spyId,
  actualLocation,
  roundResult,
  currentRound,
  isHost,
  onNextRound,
  onCloseRoom,
  isStarting,
}: SpyFallRoundEndScreenProps) {
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const spyPlayer = players.find((p) => p.id === spyId);
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-blue-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-white mb-2">🕵️ Spy Fall</h1>
          <p className="text-cyan-200">รอบที่ {currentRound} จบแล้ว!</p>
        </div>

        {/* Result announcement */}
        <div
          className={`relative overflow-hidden rounded-3xl p-8 mb-8 border-2 ${
            roundResult === "spy-wins"
              ? "bg-gradient-to-br from-red-900/50 to-red-800/30 border-red-500/50"
              : "bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-500/50"
          }`}
        >
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl bg-white/10" />
          
          <div className="relative z-10 text-center">
            <div className="text-7xl mb-4">
              {roundResult === "spy-wins" ? "🕵️" : "🎯"}
            </div>
            <h2 className={`text-3xl font-bold mb-4 ${
              roundResult === "spy-wins" ? "text-red-300" : "text-green-300"
            }`}>
              {roundResult === "spy-wins" ? "Spy ชนะ!" : "หา Spy เจอ!"}
            </h2>
            
            {spyPlayer && (
              <div className="mb-4">
                <p className="text-white/70 text-sm mb-1">Spy คือ</p>
                <p className="text-2xl font-bold text-white">{spyPlayer.name}</p>
              </div>
            )}
            
            {actualLocation && (
              <div className="inline-block px-6 py-3 bg-white/10 rounded-2xl">
                <p className="text-white/70 text-sm mb-1">สถานที่ที่ถูกต้อง</p>
                <p className="text-xl font-bold text-cyan-300">{actualLocation}</p>
              </div>
            )}
          </div>
        </div>

        {/* Scoreboard */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">🏆 คะแนนรวม</h2>
          <div className="space-y-3">
            {sortedPlayers.map((player, index) => {
              const isCurrentUser = player.id === currentPlayerId;
              const isSpy = player.id === spyId;
              const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "";

              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isCurrentUser
                      ? "bg-cyan-500/20 border border-cyan-500/50"
                      : isSpy
                      ? "bg-red-500/10 border border-red-500/30"
                      : "bg-white/5 border border-white/10"
                  }`}
                >
                  <div className="text-2xl w-8 text-center">{medal || `#${index + 1}`}</div>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      isSpy
                        ? "bg-gradient-to-br from-red-500 to-red-700"
                        : "bg-gradient-to-br from-cyan-500 to-blue-600"
                    }`}
                  >
                    {isSpy ? "🕵️" : player.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">
                      {player.name}
                      {isCurrentUser && <span className="text-cyan-400 ml-2">(คุณ)</span>}
                      {isSpy && <span className="text-red-400 ml-2">[Spy]</span>}
                    </p>
                    <p className="text-xs text-cyan-300">
                      ชนะ {player.wins} รอบ
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{player.score}</p>
                    <p className="text-xs text-cyan-300">คะแนน</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Host controls */}
        {isHost && (
          <div className="space-y-3">
            <button
              onClick={onNextRound}
              disabled={isStarting}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isStarting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  กำลังเริ่มรอบถัดไป...
                </span>
              ) : (
                "🎮 เริ่มรอบถัดไป"
              )}
            </button>

            {showConfirmClose ? (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onCloseRoom();
                    setShowConfirmClose(false);
                  }}
                  className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl"
                >
                  ยืนยันปิดห้อง
                </button>
                <button
                  onClick={() => setShowConfirmClose(false)}
                  className="flex-1 py-3 bg-white/10 text-white rounded-xl"
                >
                  ยกเลิก
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmClose(true)}
                className="w-full py-3 bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl hover:bg-red-500/30 transition-colors"
              >
                🚪 ปิดห้องและจบเกม
              </button>
            )}
          </div>
        )}

        {/* Non-host message */}
        {!isHost && (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">⏳</div>
            <p className="text-cyan-200">รอ Host เริ่มรอบถัดไป...</p>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import type { Player } from "../types";
import ScoreBoard from "@/components/ScoreBoard";
import CategorySelector from "./CategorySelector";

interface RoundEndScreenProps {
  players: Player[];
  currentPlayerId: string;
  currentRound: number;
  playedCategories: string[];
  isHost: boolean;
  onNextRound: (category: string | null, timerMinutes: number) => void;
  onCloseRoom: () => void;
  isStarting: boolean;
}

export default function RoundEndScreen({
  players,
  currentPlayerId,
  currentRound,
  playedCategories,
  isHost,
  onNextRound,
  onCloseRoom,
  isStarting,
}: RoundEndScreenProps) {
  const [showNextRound, setShowNextRound] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 pt-4">
          <h1 className="text-3xl font-bold text-white mb-2">
            🎉 จบรอบที่ {currentRound}!
          </h1>
          <p className="text-purple-200">ทุกคนตอบถูกครบแล้ว</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Score Board */}
          <ScoreBoard players={players} currentPlayerId={currentPlayerId} />

          {/* Category History */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4 text-center">
              📜 หมวดหมู่ที่เล่นแล้ว
            </h2>
            <div className="space-y-2">
              {playedCategories.map((category, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    index === playedCategories.length - 1
                      ? "bg-pink-500/20 border border-pink-500/50"
                      : "bg-white/5 border border-white/10"
                  }`}
                >
                  <span className="text-lg font-bold text-purple-300">
                    #{index + 1}
                  </span>
                  <span className="text-white">{category}</span>
                  {index === playedCategories.length - 1 && (
                    <span className="ml-auto text-xs text-pink-400">
                      รอบล่าสุด
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Host Controls */}
        {isHost && (
          <div className="mt-6">
            {showNextRound ? (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">
                    🎯 เริ่มรอบถัดไป
                  </h2>
                  <button
                    onClick={() => setShowNextRound(false)}
                    className="text-purple-300 hover:text-white"
                  >
                    ✕ ยกเลิก
                  </button>
                </div>
                <CategorySelector
                  onStart={onNextRound}
                  playerCount={players.length}
                  isLoading={isStarting}
                />
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setShowNextRound(true)}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg rounded-xl shadow-lg hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-[1.02]"
                >
                  🎮 เริ่มรอบถัดไป
                </button>
                <button
                  onClick={onCloseRoom}
                  className="px-8 py-4 bg-red-500/20 border border-red-500/50 text-red-300 font-bold rounded-xl hover:bg-red-500/30 transition-all"
                >
                  🚪 จบเกมและปิดห้อง
                </button>
              </div>
            )}
          </div>
        )}

        {/* Non-host message */}
        {!isHost && (
          <div className="mt-6 text-center">
            <div className="inline-block px-6 py-4 bg-white/10 rounded-2xl border border-white/20">
              <p className="text-purple-200">
                ⏳ รอ Host เริ่มรอบถัดไปหรือจบเกม
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

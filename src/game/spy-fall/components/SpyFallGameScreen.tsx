"use client";

import { useState } from "react";
import type { SpyFallPlayer } from "../types";
import Timer from "@/components/Timer";
import { SPYFALL_LOCATIONS } from "../constants";

interface SpyFallGameScreenProps {
  currentPlayerName: string;
  players: SpyFallPlayer[];
  myLocation: string | null;
  isSpy: boolean;
  timerDuration: number;
  timerStartedAt: number;
  isHost: boolean;
  currentRound: number;
  customLocations: string[];
  excludedLocations: string[];
  onCloseRoom: () => void;
  onSpyCaught: () => void;
  onSpyWins: () => void;
  onSpyWrongGuess: () => void;
}

export default function SpyFallGameScreen({
  currentPlayerName,
  players,
  myLocation,
  isSpy,
  timerDuration,
  timerStartedAt,
  isHost,
  currentRound,
  customLocations,
  excludedLocations,
  onCloseRoom,
  onSpyCaught,
  onSpyWins,
  onSpyWrongGuess,
}: SpyFallGameScreenProps) {
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [showConfirmSpyCaught, setShowConfirmSpyCaught] = useState(false);
  const [showConfirmSpyWins, setShowConfirmSpyWins] = useState(false);
  const [showConfirmSpyWrongGuess, setShowConfirmSpyWrongGuess] = useState(false);

  // All available locations (preset + custom, excluding removed ones)
  const allLocations = [...SPYFALL_LOCATIONS, ...customLocations].filter(
    (loc) => !excludedLocations.includes(loc)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-blue-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4 pt-4">
          <div className="flex items-center justify-center gap-4 mb-2">
            <span className="px-3 py-1 bg-cyan-500/20 rounded-full text-cyan-300 text-sm">
              รอบที่ {currentRound}
            </span>
            <span className="px-3 py-1 bg-white/10 rounded-full text-white text-sm">
              👥 {players.length} คน
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">🕵️ Spy Fall</h1>
          <p className="text-cyan-200">หา Spy ให้เจอ หรือ Spy ทายสถานที่!</p>
        </div>

        {/* Timer */}
        <div className="mb-6">
          <Timer duration={timerDuration} startedAt={timerStartedAt} />
        </div>

        {/* My role card */}
        <div className="mb-6">
          <div
            className={`relative overflow-hidden rounded-3xl p-8 border-2 ${
              isSpy
                ? "bg-gradient-to-br from-red-900/50 to-red-800/30 border-red-500/50"
                : "bg-gradient-to-br from-cyan-900/50 to-blue-800/30 border-cyan-500/50"
            }`}
          >
            {/* Decorative elements */}
            <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl ${
              isSpy ? "bg-red-500/20" : "bg-cyan-500/20"
            }`} />
            <div className={`absolute bottom-0 left-0 w-32 h-32 rounded-full blur-2xl ${
              isSpy ? "bg-red-600/10" : "bg-blue-500/10"
            }`} />

            <div className="relative z-10 text-center">
              <div className="text-6xl mb-4">
                {isSpy ? "🕵️" : "📍"}
              </div>
              <p className="text-white font-semibold text-lg mb-2">
                {currentPlayerName}
              </p>
              
              {isSpy ? (
                <>
                  <p className="text-red-300 text-sm mb-4">คุณคือ Spy!</p>
                  <div className="inline-block px-6 py-4 bg-red-500/20 rounded-2xl border border-red-500/30">
                    <p className="text-red-200 text-sm mb-1">สถานที่</p>
                    <p className="text-4xl font-bold text-red-300">?????</p>
                  </div>
                  <p className="text-red-200/70 text-sm mt-4">
                    พยายามหาว่าคนอื่นอยู่ที่ไหน โดยไม่ให้ใครรู้ว่าคุณคือ Spy!
                  </p>
                </>
              ) : (
                <>
                  <p className="text-cyan-300 text-sm mb-4">คุณได้รับสถานที่แล้ว</p>
                  <div className="inline-block px-6 py-4 bg-cyan-500/20 rounded-2xl border border-cyan-500/30">
                    <p className="text-cyan-200 text-sm mb-1">สถานที่ของคุณ</p>
                    <p className="text-3xl font-bold text-white">{myLocation}</p>
                  </div>
                  <p className="text-cyan-200/70 text-sm mt-4">
                    ถามคำถามเพื่อหา Spy แต่อย่าเปิดเผยสถานที่มากเกินไป!
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Players list */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">
            👥 ผู้เล่นทั้งหมด ({players.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {players.map((player) => (
              <div
                key={player.id}
                className="p-3 rounded-xl bg-white/5 border border-white/10 text-center"
              >
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <p className="text-white font-medium text-sm truncate">
                  {player.name}
                </p>
                {player.isHost && (
                  <span className="text-yellow-400 text-xs">👑 Host</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Game tips */}
        <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
          <h3 className="text-white font-semibold mb-2">💡 วิธีเล่น</h3>
          <ul className="text-cyan-200/80 text-sm space-y-1">
            <li>• ผลัดกันถามคำถามเกี่ยวกับ &quot;สถานที่&quot;</li>
            <li>• ถามแบบกว้างๆ เพื่อไม่ให้ Spy รู้สถานที่</li>
            <li>• สังเกตคนที่ตอบแปลกๆ อาจเป็น Spy!</li>
            <li>• Spy พยายามเดาสถานที่จากคำตอบ</li>
          </ul>
        </div>

        {/* All locations list */}
        <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
          <h3 className="text-white font-semibold mb-3">
            📍 สถานที่ทั้งหมด ({allLocations.length} แห่ง)
            {customLocations.length > 0 && (
              <span className="text-cyan-400 text-sm font-normal ml-2">
                (+{customLocations.length} เพิ่มเอง)
              </span>
            )}
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {allLocations.map((location) => (
              <div
                key={location}
                className={`px-2 py-1.5 text-center text-xs rounded-lg transition-colors ${
                  !isSpy && myLocation === location
                    ? "bg-cyan-500/30 border border-cyan-500/50 text-cyan-200 font-semibold"
                    : customLocations.includes(location)
                    ? "bg-purple-500/20 border border-purple-500/30 text-purple-200 hover:bg-purple-500/30"
                    : "bg-white/5 text-white/70 hover:bg-white/10"
                }`}
              >
                {location}
              </div>
            ))}
          </div>
          <p className="text-white/50 text-xs mt-3 text-center">
            {isSpy 
              ? "หนึ่งในสถานที่เหล่านี้คือคำตอบ - ลองเดาดูสิ!" 
              : "สถานที่ของคุณจะถูกไฮไลท์"}
          </p>
        </div>

        {/* Host controls - End round */}
        {isHost && (
          <div className="mb-6 space-y-3">
            <p className="text-center text-cyan-300 text-sm mb-2">
              🎮 Host: จบรอบเมื่อหา Spy เจอ หรือ Spy ทาย
            </p>
            
            {showConfirmSpyCaught ? (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onSpyCaught();
                    setShowConfirmSpyCaught(false);
                  }}
                  className="flex-1 py-3 bg-green-500 text-white font-bold rounded-xl"
                >
                  ยืนยัน: หา Spy เจอ!
                </button>
                <button
                  onClick={() => setShowConfirmSpyCaught(false)}
                  className="flex-1 py-3 bg-white/10 text-white rounded-xl"
                >
                  ยกเลิก
                </button>
              </div>
            ) : showConfirmSpyWins ? (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onSpyWins();
                    setShowConfirmSpyWins(false);
                  }}
                  className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl"
                >
                  ยืนยัน: Spy ทายถูก!
                </button>
                <button
                  onClick={() => setShowConfirmSpyWins(false)}
                  className="flex-1 py-3 bg-white/10 text-white rounded-xl"
                >
                  ยกเลิก
                </button>
              </div>
            ) : showConfirmSpyWrongGuess ? (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onSpyWrongGuess();
                    setShowConfirmSpyWrongGuess(false);
                  }}
                  className="flex-1 py-3 bg-yellow-500 text-white font-bold rounded-xl"
                >
                  ยืนยัน: Spy ทายผิด!
                </button>
                <button
                  onClick={() => setShowConfirmSpyWrongGuess(false)}
                  className="flex-1 py-3 bg-white/10 text-white rounded-xl"
                >
                  ยกเลิก
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmSpyCaught(true)}
                    className="flex-1 py-3 bg-green-500/20 border border-green-500/50 text-green-300 font-bold rounded-xl hover:bg-green-500/30 transition-colors"
                  >
                    🎯 หา Spy เจอ!
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmSpyWins(true)}
                    className="flex-1 py-3 bg-red-500/20 border border-red-500/50 text-red-300 font-bold rounded-xl hover:bg-red-500/30 transition-colors"
                  >
                    🕵️ Spy ทายถูก!
                  </button>
                  <button
                    onClick={() => setShowConfirmSpyWrongGuess(true)}
                    className="flex-1 py-3 bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 font-bold rounded-xl hover:bg-yellow-500/30 transition-colors"
                  >
                    ❌ Spy ทายผิด!
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Host controls - Close room */}
        {isHost && (
          <div className="fixed bottom-4 left-4 right-4 max-w-4xl mx-auto">
            <div className="bg-black/50 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
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
          </div>
        )}

        {/* Spacer for fixed button */}
        {isHost && <div className="h-24" />}
      </div>
    </div>
  );
}

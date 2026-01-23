"use client";

import { useState } from "react";
import type { PlayerWithWord, Player } from "@/types/game";
import Timer from "./Timer";
import ScoreBoard from "./ScoreBoard";

interface GameScreenProps {
  category: string;
  currentPlayerName: string;
  currentPlayerId: string;
  otherPlayers: PlayerWithWord[];
  allPlayers: Player[];
  timerDuration: number;
  timerStartedAt: number;
  isHost: boolean;
  currentRound: number;
  onCloseRoom: () => void;
  onRevealWord: () => void;
  onMarkCorrect: (playerId: string) => void;
  onMarkWrong: (playerId: string) => void;
  myRevealedWord: string | null;
  myHasAnswered: boolean;
  myIsEliminated: boolean;
}

export default function GameScreen({
  category,
  currentPlayerName,
  currentPlayerId,
  otherPlayers,
  allPlayers,
  timerDuration,
  timerStartedAt,
  isHost,
  currentRound,
  onCloseRoom,
  onRevealWord,
  onMarkCorrect,
  onMarkWrong,
  myRevealedWord,
  myHasAnswered,
  myIsEliminated,
}: GameScreenProps) {
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [showConfirmReveal, setShowConfirmReveal] = useState(false);

  const answeredCount = allPlayers.filter((p) => p.hasAnswered).length;
  const eliminatedCount = allPlayers.filter((p) => p.isEliminated).length;
  const totalPlayers = allPlayers.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4 pt-4">
          <div className="flex items-center justify-center gap-4 mb-2 flex-wrap">
            <span className="px-3 py-1 bg-cyan-500/20 rounded-full text-cyan-300 text-sm">
              รอบที่ {currentRound}
            </span>
            <span className="px-3 py-1 bg-green-500/20 rounded-full text-green-300 text-sm">
              ✅ ตอบถูก {answeredCount}/{totalPlayers}
            </span>
            {eliminatedCount > 0 && (
              <span className="px-3 py-1 bg-red-500/20 rounded-full text-red-300 text-sm">
                ❌ ตอบผิด {eliminatedCount}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">🎭 Who Am I?</h1>
          <div className="inline-block px-4 py-2 bg-white/10 rounded-full">
            <span className="text-purple-300">หมวดหมู่: </span>
            <span className="text-white font-bold">{category}</span>
          </div>
        </div>

        {/* Timer */}
        <div className="mb-4">
          <Timer duration={timerDuration} startedAt={timerStartedAt} />
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {/* My card (word hidden) - 2 columns */}
          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold text-white mb-3">🔮 คำของคุณ</h2>
            <div
              className={`bg-white/10 backdrop-blur-lg rounded-2xl p-6 border ${
                myHasAnswered
                  ? "border-green-500/50 bg-green-500/10"
                  : myIsEliminated
                  ? "border-red-500/50 bg-red-500/10"
                  : "border-pink-500/30"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold text-white ${
                    myHasAnswered
                      ? "bg-gradient-to-br from-green-500 to-emerald-600"
                      : myIsEliminated
                      ? "bg-gradient-to-br from-red-500 to-red-700"
                      : "bg-gradient-to-br from-pink-500 to-purple-600"
                  }`}
                >
                  {myHasAnswered ? "✓" : myIsEliminated ? "✗" : currentPlayerName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-lg">
                    {currentPlayerName}{" "}
                    <span className="text-pink-400">(คุณ)</span>
                  </p>
                  {myHasAnswered ? (
                    <p className="text-green-400 font-bold">
                      ✅ คุณตอบถูกแล้ว!
                    </p>
                  ) : myIsEliminated ? (
                    <p className="text-red-400 font-bold">
                      ❌ คุณถูกคัดออกจากรอบนี้
                    </p>
                  ) : myRevealedWord ? (
                    <p className="text-2xl font-bold text-yellow-400 mt-1">
                      {myRevealedWord}
                    </p>
                  ) : (
                    <p className="text-purple-300">
                      คำถูกซ่อน - ถามคนอื่นเพื่อทาย!
                    </p>
                  )}
                </div>
              </div>

              {/* Reveal button */}
              {!myRevealedWord && !myHasAnswered && !myIsEliminated && (
                <div className="mt-4">
                  {showConfirmReveal ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          onRevealWord();
                          setShowConfirmReveal(false);
                        }}
                        className="flex-1 py-2 bg-yellow-500 text-yellow-900 font-bold rounded-xl"
                      >
                        ยืนยันเปิดเผย
                      </button>
                      <button
                        onClick={() => setShowConfirmReveal(false)}
                        className="flex-1 py-2 bg-white/10 text-white rounded-xl"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowConfirmReveal(true)}
                      className="w-full py-2 bg-white/10 text-purple-300 rounded-xl hover:bg-white/20 transition-colors"
                    >
                      👁️ เปิดเผยคำของฉัน (ดูคำตอบ)
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ScoreBoard - 1 column */}
          <div className="md:col-span-1">
            <ScoreBoard
              players={allPlayers}
              currentPlayerId={currentPlayerId}
              title="🏆 คะแนน"
              compact
            />
          </div>
        </div>

        {/* Other players */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">
            👥 ผู้เล่นอื่น ({otherPlayers.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {otherPlayers.map((player) => (
              <div
                key={player.id}
                className={`relative p-4 rounded-2xl border-2 transition-all ${
                  player.hasAnswered
                    ? "bg-green-500/20 border-green-500/50"
                    : player.isEliminated
                    ? "bg-red-500/20 border-red-500/50"
                    : "bg-white/5 border-white/10 hover:border-white/20"
                }`}
              >
                {/* Status badge */}
                {player.hasAnswered && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    ✓ #{player.answerOrder}
                  </div>
                )}
                {player.isEliminated && !player.hasAnswered && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    ✗ ออก
                  </div>
                )}

                {/* Player info */}
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                      player.hasAnswered
                        ? "bg-green-500 text-white"
                        : player.isEliminated
                        ? "bg-red-500 text-white"
                        : "bg-white/10 text-purple-200"
                    }`}
                  >
                    {player.hasAnswered
                      ? "✓"
                      : player.isEliminated
                      ? "✗"
                      : player.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{player.name}</p>
                    <p className="text-xs text-purple-300">
                      คะแนน: {player.score}
                    </p>
                  </div>
                </div>

                {/* Word display */}
                <div className="p-3 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-xl">
                  <p className="text-xs text-purple-300 mb-1">คำของผู้เล่นนี้</p>
                  <p className="text-xl font-bold text-white">{player.word}</p>
                </div>

                {/* Host control: Mark as correct or wrong */}
                {isHost && !player.hasAnswered && !player.isEliminated && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => onMarkCorrect(player.id)}
                      className="flex-1 py-2 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors"
                    >
                      ✅ ถูก
                    </button>
                    <button
                      onClick={() => onMarkWrong(player.id)}
                      className="flex-1 py-2 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors"
                    >
                      ❌ ผิด
                    </button>
                  </div>
                )}

                {player.hasAnswered && (
                  <div className="mt-3 text-center text-green-400 text-sm">
                    ได้ +
                    {player.answerOrder === 1
                      ? 3
                      : player.answerOrder === 2
                      ? 2
                      : player.answerOrder === 3
                      ? 1
                      : 0}{" "}
                    คะแนน
                  </div>
                )}

                {player.isEliminated && !player.hasAnswered && (
                  <div className="mt-3 text-center text-red-400 text-sm">
                    ถูกคัดออกจากรอบนี้
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Host: Mark current player (self) as correct or wrong */}
        {isHost && !myHasAnswered && !myIsEliminated && (
          <div className="mb-6 flex gap-3">
            <button
              onClick={() => onMarkCorrect(currentPlayerId)}
              className="flex-1 py-3 bg-green-500/20 border border-green-500/50 text-green-300 font-bold rounded-xl hover:bg-green-500/30 transition-colors"
            >
              ✅ ฉัน (Host) ตอบถูก!
            </button>
            <button
              onClick={() => onMarkWrong(currentPlayerId)}
              className="flex-1 py-3 bg-red-500/20 border border-red-500/50 text-red-300 font-bold rounded-xl hover:bg-red-500/30 transition-colors"
            >
              ❌ ฉัน (Host) ตอบผิด
            </button>
          </div>
        )}

        {/* Host controls */}
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

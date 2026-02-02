"use client";

import { useState } from "react";
import type { ImposterPlayer, ImposterWinResult } from "../types";

interface UndercoverRoundEndScreenProps {
  players: ImposterPlayer[];
  currentPlayerId: string;
  result: ImposterWinResult;
  citizenWord: string;
  imposterWord: string;
  currentRound: number;
  isHost: boolean;
  onNextRound: () => void;
  onCloseRoom: () => void;
  onKickPlayer: (playerId: string) => void;
  isStarting: boolean;
}

// Result display info (Citizen, The Imposter, The Blank)
const RESULT_INFO: Record<ImposterWinResult, { title: string; emoji: string; color: string; bgColor: string }> = {
  "citizen-win": { title: "Citizen ชนะ!", emoji: "👤", color: "text-blue-300", bgColor: "from-blue-900/50 to-blue-800/30" },
  "imposter-win": { title: "The Imposter ชนะ!", emoji: "🕵️", color: "text-red-300", bgColor: "from-red-900/50 to-red-800/30" },
  "blank-win": { title: "The Blank ชนะ!", emoji: "👻", color: "text-gray-300", bgColor: "from-gray-900/50 to-gray-800/30" },
};

const ROLE_INFO: Record<string, { name: string; emoji: string; color: string }> = {
  citizen: { name: "Citizen", emoji: "👤", color: "text-blue-300" },
  imposter: { name: "The Imposter", emoji: "🕵️", color: "text-red-300" },
  blank: { name: "The Blank", emoji: "👻", color: "text-gray-300" },
};

export default function UndercoverRoundEndScreen({
  players,
  currentPlayerId,
  result,
  citizenWord,
  imposterWord,
  currentRound,
  isHost,
  onNextRound,
  onCloseRoom,
  onKickPlayer,
  isStarting,
}: UndercoverRoundEndScreenProps) {
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [kickConfirmId, setKickConfirmId] = useState<string | null>(null);

  const resultInfo = RESULT_INFO[result];
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎭 The Imposter</h1>
          <p className="text-purple-200">รอบที่ {currentRound} จบแล้ว!</p>
        </div>

        {/* Result announcement */}
        <div
          className={`relative overflow-hidden rounded-3xl p-8 mb-8 border-2 bg-gradient-to-br ${resultInfo.bgColor} border-white/20`}
        >
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl bg-white/10" />
          
          <div className="relative z-10 text-center">
            <div className="text-7xl mb-4">{resultInfo.emoji}</div>
            <h2 className={`text-3xl font-bold mb-4 ${resultInfo.color}`}>
              {resultInfo.title}
            </h2>
            
            {/* Words reveal */}
            <div className="flex justify-center gap-4 mb-4 flex-wrap">
              <div className="px-4 py-2 bg-blue-500/20 rounded-xl">
                <p className="text-blue-300 text-xs mb-1">คำ Citizen</p>
                <p className="text-white font-bold text-lg">{citizenWord}</p>
              </div>
              <div className="px-4 py-2 bg-red-500/20 rounded-xl">
                <p className="text-red-300 text-xs mb-1">คำ The Imposter</p>
                <p className="text-white font-bold text-lg">{imposterWord}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Players with roles revealed */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">👥 Role ของทุกคน</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {players.map((player) => {
              const roleInfo = player.role ? ROLE_INFO[player.role] : null;
              const isCurrentPlayer = player.id === currentPlayerId;

              return (
                <div
                  key={player.id}
                  className={`p-3 rounded-xl border text-center ${
                    isCurrentPlayer
                      ? "bg-purple-500/20 border-purple-500/50"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <div className="text-3xl mb-2">{roleInfo?.emoji || "❓"}</div>
                  <p className="text-white font-medium text-sm truncate">
                    {player.name}
                    {isCurrentPlayer && <span className="text-purple-400"> (คุณ)</span>}
                  </p>
                  {roleInfo && (
                    <p className={`text-xs ${roleInfo.color}`}>{roleInfo.name}</p>
                  )}
                  {player.word && (
                    <p className="text-xs text-purple-300 mt-1">คำ: {player.word}</p>
                  )}
                  {!player.isAlive && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-red-500/20 text-red-300 rounded text-xs">
                      ถูกโหวตออก
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Scoreboard */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">🏆 คะแนนรวม</h2>
          <div className="space-y-3">
            {sortedPlayers.map((player, index) => {
              const isCurrentUser = player.id === currentPlayerId;
              const roleInfo = player.role ? ROLE_INFO[player.role] : null;
              const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "";

              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isCurrentUser
                      ? "bg-purple-500/20 border border-purple-500/50"
                      : "bg-white/5 border border-white/10"
                  }`}
                >
                  <div className="text-2xl w-8 text-center">{medal || `#${index + 1}`}</div>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br from-purple-500 to-indigo-600`}
                  >
                    {roleInfo?.emoji || player.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">
                      {player.name}
                      {isCurrentUser && <span className="text-purple-400 ml-2">(คุณ)</span>}
                    </p>
                    <p className="text-xs text-purple-300">
                      {roleInfo?.name || "ผู้ดู"} • ชนะ {player.wins} รอบ
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{player.score}</p>
                    <p className="text-xs text-purple-300">คะแนน</p>
                  </div>
                  {/* Kick button for host */}
                  {isHost && !isCurrentUser && !player.isHost && (
                    kickConfirmId === player.id ? (
                      <div className="flex flex-col gap-1 ml-2">
                        <button
                          onClick={() => {
                            onKickPlayer(player.id);
                            setKickConfirmId(null);
                          }}
                          className="px-2 py-1 bg-red-500 text-white text-xs rounded-lg"
                        >
                          ยืนยัน
                        </button>
                        <button
                          onClick={() => setKickConfirmId(null)}
                          className="px-2 py-1 bg-white/10 text-white text-xs rounded-lg"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setKickConfirmId(player.id)}
                        className="ml-2 px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded-lg hover:bg-red-500/30 transition-colors"
                      >
                        เตะ
                      </button>
                    )
                  )}
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
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-xl hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
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
            <p className="text-purple-200">รอ Host เริ่มรอบถัดไป...</p>
          </div>
        )}
      </div>
    </div>
  );
}

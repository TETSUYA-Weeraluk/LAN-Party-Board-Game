"use client";

import { useState, useEffect } from "react";
import type { UndercoverPlayer, UndercoverRole, UndercoverVoteResultData, UndercoverMrWhiteGuessResultData } from "../types";

interface UndercoverGameScreenProps {
  currentPlayerId: string;
  currentPlayerName: string;
  myRole: UndercoverRole;
  myWord: string | null;
  alivePlayers: UndercoverPlayer[];
  spectators: UndercoverPlayer[];
  isHost: boolean;
  isSpectator: boolean;
  currentRound: number;
  voteResult: UndercoverVoteResultData | null;
  mrWhiteGuessResult: UndercoverMrWhiteGuessResultData | null;
  waitingForMrWhiteGuess: boolean;
  onVote: (playerId: string) => void;
  onMrWhiteGuess: (guess: string) => void;
  onCloseRoom: () => void;
  onEndGame: () => void;
}

// Role display info
const ROLE_INFO: Record<UndercoverRole, { name: string; emoji: string; color: string; bgColor: string }> = {
  civilian: { name: "พลเรือน", emoji: "👤", color: "text-blue-300", bgColor: "bg-blue-500/20" },
  undercover: { name: "Undercover", emoji: "🕵️", color: "text-red-300", bgColor: "bg-red-500/20" },
  mrwhite: { name: "Mr.White", emoji: "👻", color: "text-gray-300", bgColor: "bg-gray-500/20" },
};

export default function UndercoverGameScreen({
  currentPlayerId,
  currentPlayerName,
  myRole,
  myWord,
  alivePlayers,
  spectators,
  isHost,
  isSpectator,
  currentRound,
  voteResult,
  mrWhiteGuessResult,
  waitingForMrWhiteGuess,
  onVote,
  onMrWhiteGuess,
  onCloseRoom,
  onEndGame,
}: UndercoverGameScreenProps) {
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);
  const [selectedVotePlayer, setSelectedVotePlayer] = useState<string | null>(null);
  const [showVoteConfirm, setShowVoteConfirm] = useState(false);
  const [mrWhiteGuessInput, setMrWhiteGuessInput] = useState("");
  const [showVoteResultModal, setShowVoteResultModal] = useState(false);
  const [showGuessResultModal, setShowGuessResultModal] = useState(false);

  const roleInfo = ROLE_INFO[myRole];
  const isMrWhiteAndVoted = waitingForMrWhiteGuess && voteResult?.votedPlayerId === currentPlayerId;

  // Show vote result modal when vote happens
  useEffect(() => {
    if (voteResult) {
      setShowVoteResultModal(true);
      setSelectedVotePlayer(null);
      setShowVoteConfirm(false);
    }
  }, [voteResult]);

  // Show guess result modal
  useEffect(() => {
    if (mrWhiteGuessResult) {
      setShowGuessResultModal(true);
    }
  }, [mrWhiteGuessResult]);

  const handleVoteConfirm = () => {
    if (selectedVotePlayer) {
      onVote(selectedVotePlayer);
      setShowVoteConfirm(false);
    }
  };

  const handleMrWhiteGuessSubmit = () => {
    if (mrWhiteGuessInput.trim()) {
      onMrWhiteGuess(mrWhiteGuessInput.trim());
      setMrWhiteGuessInput("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4 pt-4">
          <div className="flex items-center justify-center gap-4 mb-2">
            <span className="px-3 py-1 bg-purple-500/20 rounded-full text-purple-300 text-sm">
              รอบที่ {currentRound}
            </span>
            <span className="px-3 py-1 bg-white/10 rounded-full text-white text-sm">
              👥 เหลือ {alivePlayers.length} คน
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">🎭 Undercover</h1>
        </div>

        {/* My role card */}
        {!isSpectator && (
          <div className="mb-6">
            <div
              className={`relative overflow-hidden rounded-3xl p-8 border-2 ${
                myRole === "civilian"
                  ? "bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-500/50"
                  : myRole === "undercover"
                  ? "bg-gradient-to-br from-red-900/50 to-red-800/30 border-red-500/50"
                  : "bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-gray-500/50"
              }`}
            >
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl bg-white/10" />

              <div className="relative z-10 text-center">
                <div className="text-6xl mb-4">{roleInfo.emoji}</div>
                <p className="text-white font-semibold text-lg mb-2">{currentPlayerName}</p>
                <p className={`${roleInfo.color} text-sm mb-4`}>คุณคือ {roleInfo.name}</p>

                {myWord ? (
                  <div className={`inline-block px-6 py-4 ${roleInfo.bgColor} rounded-2xl border border-white/20`}>
                    <p className="text-white/70 text-sm mb-1">คำของคุณ</p>
                    <p className="text-3xl font-bold text-white">{myWord}</p>
                  </div>
                ) : (
                  <div className="inline-block px-6 py-4 bg-gray-500/20 rounded-2xl border border-gray-500/30">
                    <p className="text-gray-200 text-sm mb-1">คำของคุณ</p>
                    <p className="text-3xl font-bold text-gray-300">?????</p>
                    <p className="text-gray-400 text-xs mt-2">พยายามเดาจากบทสนทนา!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Spectator view */}
        {isSpectator && (
          <div className="mb-6 p-4 bg-purple-500/20 rounded-2xl border border-purple-500/30">
            <p className="text-center text-purple-200">👀 คุณเป็นผู้ดู - เห็น Role และคำของทุกคน</p>
          </div>
        )}

        {/* Players list */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">
            👥 ผู้เล่นที่ยังอยู่ ({alivePlayers.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {alivePlayers.map((player) => {
              const playerRoleInfo = player.role ? ROLE_INFO[player.role] : null;
              const isSelected = selectedVotePlayer === player.id;
              const isCurrentPlayer = player.id === currentPlayerId;

              return (
                <div
                  key={player.id}
                  onClick={() => {
                    if (isHost && !isCurrentPlayer && player.isAlive) {
                      setSelectedVotePlayer(player.id);
                      setShowVoteConfirm(true);
                    }
                  }}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    isSelected
                      ? "bg-red-500/30 border-red-500/50 ring-2 ring-red-500"
                      : isCurrentPlayer
                      ? "bg-purple-500/20 border-purple-500/50"
                      : isHost && player.isAlive
                      ? "bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-white font-medium text-sm truncate">
                    {player.name}
                    {isCurrentPlayer && <span className="text-purple-400"> (คุณ)</span>}
                  </p>
                  {player.isHost && (
                    <span className="text-yellow-400 text-xs">👑 Host</span>
                  )}
                  
                  {/* Show role for spectators */}
                  {isSpectator && playerRoleInfo && (
                    <div className={`mt-1 px-2 py-0.5 rounded-full text-xs ${playerRoleInfo.bgColor} ${playerRoleInfo.color}`}>
                      {playerRoleInfo.emoji} {playerRoleInfo.name}
                    </div>
                  )}
                  {isSpectator && player.word && (
                    <p className="text-xs text-purple-300 mt-1">คำ: {player.word}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Spectators list */}
        {spectators.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-purple-300 mb-2">👀 ผู้ดู ({spectators.length})</h3>
            <div className="flex flex-wrap gap-2">
              {spectators.map((player) => (
                <span
                  key={player.id}
                  className="px-3 py-1 rounded-full text-sm bg-white/10 text-white/70"
                >
                  {player.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Game tips */}
        <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
          <h3 className="text-white font-semibold mb-2">💡 วิธีเล่น</h3>
          <ul className="text-purple-200/80 text-sm space-y-1">
            <li>• ผลัดกันบอกใบ้คำของตัวเอง (ห้ามพูดคำโดยตรง)</li>
            <li>• สังเกตคนที่บอกใบ้ &quot;แปลกๆ&quot; อาจเป็น Undercover หรือ Mr.White</li>
            <li>• โหวตคนที่คิดว่าไม่ใช่พลเรือนออก</li>
            <li>• Mr.White ไม่รู้คำใดๆ - ต้องเดาจากบทสนทนา!</li>
          </ul>
        </div>

        {/* Host vote controls */}
        {isHost && (
          <div className="mb-6 p-4 bg-purple-500/20 rounded-2xl border border-purple-500/30">
            <p className="text-center text-purple-200 text-sm mb-2">
              🎮 Host: คลิกที่ผู้เล่นเพื่อโหวตออก
            </p>
          </div>
        )}

        {/* Vote confirm modal */}
        {showVoteConfirm && selectedVotePlayer && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full border border-white/20">
              <h3 className="text-xl font-bold text-white text-center mb-4">🗳️ ยืนยันการโหวต</h3>
              <p className="text-purple-200 text-center mb-6">
                คุณต้องการโหวต <span className="text-white font-bold">
                  {alivePlayers.find(p => p.id === selectedVotePlayer)?.name}
                </span> ออกใช่ไหม?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleVoteConfirm}
                  className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors"
                >
                  ยืนยัน
                </button>
                <button
                  onClick={() => {
                    setShowVoteConfirm(false);
                    setSelectedVotePlayer(null);
                  }}
                  className="flex-1 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Vote result modal */}
        {showVoteResultModal && voteResult && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full border border-white/20">
              <div className="text-center">
                <div className="text-6xl mb-4">
                  {ROLE_INFO[voteResult.votedPlayerRole].emoji}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {voteResult.votedPlayerName} ถูกโหวตออก!
                </h3>
                <div className={`inline-block px-4 py-2 rounded-full ${ROLE_INFO[voteResult.votedPlayerRole].bgColor} ${ROLE_INFO[voteResult.votedPlayerRole].color} text-lg font-semibold mb-4`}>
                  {ROLE_INFO[voteResult.votedPlayerRole].name}
                </div>
                
                {voteResult.votedPlayerWord && (
                  <p className="text-purple-300 mb-4">
                    คำของเขา: <span className="text-white font-semibold">{voteResult.votedPlayerWord}</span>
                  </p>
                )}

                {voteResult.isMrWhiteGuessing ? (
                  <p className="text-yellow-300 animate-pulse">
                    Mr.White กำลังทายคำ...
                  </p>
                ) : (
                  <button
                    onClick={() => setShowVoteResultModal(false)}
                    className="px-6 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
                  >
                    ปิด
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mr.White guess modal */}
        {isMrWhiteAndVoted && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full border border-white/20">
              <div className="text-center mb-4">
                <div className="text-6xl mb-4">👻</div>
                <h3 className="text-xl font-bold text-white mb-2">คุณคือ Mr.White!</h3>
                <p className="text-purple-200 mb-4">
                  คุณถูกโหวตออก แต่ถ้าทายคำของพลเรือนถูก คุณจะชนะ!
                </p>
              </div>
              
              <div className="space-y-4">
                <input
                  type="text"
                  value={mrWhiteGuessInput}
                  onChange={(e) => setMrWhiteGuessInput(e.target.value)}
                  placeholder="พิมพ์คำที่คุณคิดว่าถูก..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
                />
                <button
                  onClick={handleMrWhiteGuessSubmit}
                  disabled={!mrWhiteGuessInput.trim()}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-xl hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  🎯 ส่งคำตอบ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mr.White guess result modal */}
        {showGuessResultModal && mrWhiteGuessResult && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full border border-white/20">
              <div className="text-center">
                <div className="text-6xl mb-4">
                  {mrWhiteGuessResult.isCorrect ? "🎉" : "❌"}
                </div>
                <h3 className={`text-xl font-bold mb-2 ${mrWhiteGuessResult.isCorrect ? "text-green-400" : "text-red-400"}`}>
                  {mrWhiteGuessResult.playerName} ทาย{mrWhiteGuessResult.isCorrect ? "ถูก" : "ผิด"}!
                </h3>
                <p className="text-purple-200 mb-4">
                  {mrWhiteGuessResult.isCorrect
                    ? "Mr.White ชนะ!"
                    : "Mr.White ไม่สามารถทายคำได้ถูกต้อง"}
                </p>
                <button
                  onClick={() => setShowGuessResultModal(false)}
                  className="px-6 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Host controls */}
        {isHost && (
          <div className="fixed bottom-4 left-4 right-4 max-w-4xl mx-auto">
            <div className="bg-black/50 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
              {showConfirmEnd ? (
                <div className="flex gap-3 mb-3">
                  <button
                    onClick={() => {
                      onEndGame();
                      setShowConfirmEnd(false);
                    }}
                    className="flex-1 py-3 bg-yellow-500 text-white font-bold rounded-xl"
                  >
                    ยืนยันจบเกม
                  </button>
                  <button
                    onClick={() => setShowConfirmEnd(false)}
                    className="flex-1 py-3 bg-white/10 text-white rounded-xl"
                  >
                    ยกเลิก
                  </button>
                </div>
              ) : showConfirmClose ? (
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
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmEnd(true)}
                    className="flex-1 py-3 bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 rounded-xl hover:bg-yellow-500/30 transition-colors"
                  >
                    ⏹️ จบเกม
                  </button>
                  <button
                    onClick={() => setShowConfirmClose(true)}
                    className="flex-1 py-3 bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl hover:bg-red-500/30 transition-colors"
                  >
                    🚪 ปิดห้อง
                  </button>
                </div>
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

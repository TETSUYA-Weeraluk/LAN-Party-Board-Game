"use client";

import type { Player, PlayerWithWord } from "../types";

interface PlayerCardProps {
  player: Player | PlayerWithWord;
  isCurrentUser?: boolean;
  showWord?: boolean;
}

export default function PlayerCard({
  player,
  isCurrentUser = false,
  showWord = false,
}: PlayerCardProps) {
  const word = "word" in player ? player.word : undefined;
  const isHost = "isHost" in player ? player.isHost : false;

  return (
    <div
      className={`relative p-4 rounded-2xl border-2 transition-all ${
        isCurrentUser
          ? "bg-gradient-to-br from-pink-500/20 to-purple-500/20 border-pink-400/50"
          : "bg-white/5 border-white/10 hover:border-white/20"
      }`}
    >
      {/* Host badge */}
      {isHost && (
        <div className="absolute -top-2 -right-2 bg-yellow-500 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
          👑 Host
        </div>
      )}

      {/* Player name */}
      <div className="flex items-center gap-3 mb-2">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
            isCurrentUser
              ? "bg-gradient-to-br from-pink-500 to-purple-600 text-white"
              : "bg-white/10 text-purple-200"
          }`}
        >
          {player.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-white">
            {player.name}
            {isCurrentUser && (
              <span className="ml-2 text-sm text-pink-400">(คุณ)</span>
            )}
          </p>
        </div>
      </div>

      {/* Word display */}
      {showWord && word && (
        <div className="mt-3 p-3 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-xl">
          <p className="text-xs text-purple-300 mb-1">คำของผู้เล่นนี้</p>
          <p className="text-xl font-bold text-white">{word}</p>
        </div>
      )}

      {/* Hidden word indicator for current user */}
      {isCurrentUser && !showWord && (
        <div className="mt-3 p-3 bg-black/20 rounded-xl border border-dashed border-purple-400/30">
          <p className="text-sm text-purple-300 text-center">
            🔮 คำของคุณถูกซ่อนไว้
          </p>
        </div>
      )}
    </div>
  );
}

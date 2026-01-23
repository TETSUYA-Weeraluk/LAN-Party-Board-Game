"use client";

import type { Player } from "@/types/game";

interface ScoreBoardProps {
  players: Player[];
  currentPlayerId?: string;
  title?: string;
  compact?: boolean;
}

export default function ScoreBoard({
  players,
  currentPlayerId,
  title = "🏆 ตารางคะแนน",
  compact = false,
}: ScoreBoardProps) {
  // Sort players by score (descending)
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  // Get medal emoji based on rank
  const getMedal = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}.`;
  };

  if (compact) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3 border border-white/20">
        <h3 className="text-sm font-semibold text-purple-300 mb-2">{title}</h3>
        <div className="space-y-1">
          {sortedPlayers.map((player, index) => (
            <div
              key={player.id}
              className={`flex items-center justify-between text-sm ${
                player.id === currentPlayerId ? "text-pink-400" : "text-white"
              }`}
            >
              <span>
                {getMedal(index)} {player.name}
              </span>
              <span className="font-bold">{player.score}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      <h2 className="text-xl font-bold text-white mb-4 text-center">{title}</h2>
      <div className="space-y-3">
        {sortedPlayers.map((player, index) => {
          const isCurrentUser = player.id === currentPlayerId;
          const isTop3 = index < 3;

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                isCurrentUser
                  ? "bg-pink-500/20 border border-pink-500/50"
                  : isTop3
                  ? "bg-yellow-500/10 border border-yellow-500/30"
                  : "bg-white/5 border border-white/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getMedal(index)}</span>
                <div>
                  <p
                    className={`font-semibold ${
                      isCurrentUser ? "text-pink-400" : "text-white"
                    }`}
                  >
                    {player.name}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs text-pink-300">(คุณ)</span>
                    )}
                  </p>
                  {player.hasAnswered && player.answerOrder && (
                    <p className="text-xs text-purple-300">
                      ตอบถูกลำดับที่ {player.answerOrder}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`text-2xl font-bold ${
                    isTop3 ? "text-yellow-400" : "text-white"
                  }`}
                >
                  {player.score}
                </p>
                <p className="text-xs text-purple-300">คะแนน</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

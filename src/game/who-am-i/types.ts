import type { PlayerWithWord, Player } from "@/types/shared";

// Game started data (Who Am I)
export interface GameStartedData {
  category: string;
  otherPlayers: PlayerWithWord[];
  timerDuration: number;
  timerStartedAt: number;
  currentRound: number;
  playedCategories: string[];
}

// Player answered data
export interface PlayerAnsweredData {
  playerId: string;
  playerName: string;
  score: number;
  order: number;
  totalScore: number;
}

// Player eliminated data (wrong answer)
export interface PlayerEliminatedData {
  playerId: string;
  playerName: string;
}

// Round ended data
export interface RoundEndedData {
  players: Player[];
  playedCategories: string[];
  currentRound: number;
}

// Re-export shared types for convenience
export type { Player, PlayerWithWord };

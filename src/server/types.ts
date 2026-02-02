// Server-specific types

import type {
  Player,
  SpyFallPlayer,
  ImposterPlayer,
  ImposterWinResult,
} from "@/types/game";

// Grace period duration (10 minutes in milliseconds)
export const GRACE_PERIOD_MS = 10 * 60 * 1000;

// Pending disconnect data
export interface PendingDisconnect {
  player: Player | SpyFallPlayer | ImposterPlayer;
  roomId: string;
  timeout: NodeJS.Timeout;
  wasHost: boolean;
}

// Extended GameRoom for Where Are We (เดิม Spy Fall)
export interface SpyFallGameRoom {
  id: string;
  name: string;
  password: string | null;
  hostId: string;
  hostName: string;
  players: SpyFallPlayer[];
  category: string | null;
  isPlaying: boolean;
  timerDuration: number;
  timerStartedAt: number | null;
  currentRound: number;
  playedCategories: string[];
  answeredCount: number;
  roundFinished: boolean;
  gameType: "where-are-we";
  spyId: string | null;
  currentLocation: string | null;
  customLocations: string[];
  excludedLocations: string[];
}

// Extended GameRoom for The Imposter (เดิม Undercover)
export interface ImposterGameRoom {
  id: string;
  name: string;
  password: string | null;
  hostId: string;
  hostName: string;
  players: ImposterPlayer[];
  isPlaying: boolean;
  currentRound: number;
  roundFinished: boolean;
  gameType: "imposter";
  citizenWord: string | null;
  imposterWord: string | null;
  lastVotedPlayerId: string | null;
  waitingForBlankGuess: boolean;
  roundResult: ImposterWinResult | null;
  currentTurnPlayerId: string | null;
  usedWordPairIndices: number[];
}

// Union type for all room types
export type AnyGameRoom = import("@/types/game").GameRoom | SpyFallGameRoom | ImposterGameRoom;

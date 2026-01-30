// Server-specific types

import type {
  Player,
  SpyFallPlayer,
  UndercoverPlayer,
  UndercoverWinResult,
} from "@/types/game";

// Grace period duration (10 minutes in milliseconds)
export const GRACE_PERIOD_MS = 10 * 60 * 1000;

// Pending disconnect data
export interface PendingDisconnect {
  player: Player | SpyFallPlayer | UndercoverPlayer;
  roomId: string;
  timeout: NodeJS.Timeout;
  wasHost: boolean;
}

// Extended GameRoom for Spy Fall
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
  gameType: "spy-fall";
  spyId: string | null;
  currentLocation: string | null;
  customLocations: string[];
  excludedLocations: string[];
}

// Extended GameRoom for Undercover
export interface UndercoverGameRoom {
  id: string;
  name: string;
  password: string | null;
  hostId: string;
  hostName: string;
  players: UndercoverPlayer[];
  isPlaying: boolean;
  currentRound: number;
  roundFinished: boolean;
  gameType: "undercover";
  civilianWord: string | null;
  undercoverWord: string | null;
  lastVotedPlayerId: string | null;
  waitingForMrWhiteGuess: boolean;
  roundResult: UndercoverWinResult | null;
  currentTurnPlayerId: string | null;  // ผู้เล่นที่ต้องเริ่มพูดก่อน
  usedWordPairIndices: number[];       // index ของคำที่ใช้ไปแล้ว
}

// Union type for all room types
export type AnyGameRoom = import("@/types/game").GameRoom | SpyFallGameRoom | UndercoverGameRoom;

// Undercover role type
export type UndercoverRole = "civilian" | "undercover" | "mrwhite";

// Undercover player interface
export interface UndercoverPlayer {
  id: string;
  sessionId: string;
  name: string;
  isHost: boolean;
  role?: UndercoverRole;   // civilian, undercover, or mrwhite
  word?: string;           // คำที่ได้รับ (Mr.White = undefined)
  isAlive: boolean;        // ยังอยู่ในเกมหรือไม่
  isSpectator: boolean;    // เป็นผู้ดูหรือไม่
  score: number;
  wins: number;
}

// Undercover game started data
export interface UndercoverGameStartedData {
  role: UndercoverRole;
  word: string | null;     // null for Mr.White
  currentRound: number;
  alivePlayers: UndercoverPlayer[];
  spectators: UndercoverPlayer[];
  currentTurnPlayerId: string;   // ผู้เล่นที่ต้องเริ่มพูดก่อน
  currentTurnPlayerName: string; // ชื่อคนเริ่ม (เก็บไว้แสดงทั้งรอบ)
}

// Undercover vote result data (เมื่อ Host โหวตผู้เล่นออก)
export interface UndercoverVoteResultData {
  votedPlayerId: string;
  votedPlayerName: string;
  votedPlayerRole: UndercoverRole;
  votedPlayerWord?: string;
  isMrWhiteGuessing: boolean;  // true ถ้า Mr.White ต้องทายคำ
  isYouGuessing?: boolean;     // true เฉพาะคนที่ต้องทาย (รองรับ reconnect)
}

// Undercover Mr.White guess result data
export interface UndercoverMrWhiteGuessResultData {
  playerId: string;
  playerName: string;
  isCorrect: boolean;
  // ไม่บอกว่าทายอะไร
}

// Undercover win result type
export type UndercoverWinResult = "civilian-win" | "undercover-win" | "mrwhite-win";

// Undercover round ended data
export interface UndercoverRoundEndedData {
  players: UndercoverPlayer[];
  result: UndercoverWinResult;
  civilianWord: string;
  undercoverWord: string;
  currentRound: number;
}

// Undercover vote data
export interface UndercoverVoteData {
  playerId: string;
}

// Undercover Mr.White guess data
export interface UndercoverMrWhiteGuessData {
  guess: string;
}

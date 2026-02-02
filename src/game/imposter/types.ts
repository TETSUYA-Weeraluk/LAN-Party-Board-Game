// The Imposter role type (เกม The Imposter - แรงบันดาลใจจาก Undercover)
export type ImposterRole = "citizen" | "imposter" | "blank";

// The Imposter player interface
export interface ImposterPlayer {
  id: string;
  sessionId: string;
  name: string;
  isHost: boolean;
  role?: ImposterRole;   // citizen, imposter, or blank (คนที่ไม่มีคำ ต้องทาย)
  word?: string;        // คำที่ได้รับ (Blank = undefined)
  isAlive: boolean;
  isSpectator: boolean;
  score: number;
  wins: number;
}

// The Imposter game started data
export interface ImposterGameStartedData {
  role: ImposterRole;
  word: string | null;   // null for Blank
  currentRound: number;
  alivePlayers: ImposterPlayer[];
  spectators: ImposterPlayer[];
  currentTurnPlayerId: string;
  currentTurnPlayerName: string;
}

// The Imposter vote result data
export interface ImposterVoteResultData {
  votedPlayerId: string;
  votedPlayerName: string;
  votedPlayerRole: ImposterRole;
  votedPlayerWord?: string;
  isBlankGuessing: boolean;  // true ถ้า Blank ต้องทายคำ
  isYouGuessing?: boolean;
}

// The Imposter Blank guess result data
export interface ImposterBlankGuessResultData {
  playerId: string;
  playerName: string;
  isCorrect: boolean;
}

// The Imposter win result type
export type ImposterWinResult = "citizen-win" | "imposter-win" | "blank-win";

// The Imposter round ended data
export interface ImposterRoundEndedData {
  players: ImposterPlayer[];
  result: ImposterWinResult;
  citizenWord: string;
  imposterWord: string;
  currentRound: number;
}

// The Imposter vote data
export interface ImposterVoteData {
  playerId: string;
}

// The Imposter Blank guess data
export interface ImposterBlankGuessData {
  guess: string;
}

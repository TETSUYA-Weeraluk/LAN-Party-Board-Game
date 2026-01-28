// Game type
export type GameType = "who-am-i" | "spy-fall" | "undercover";

// Player interface (base for Who Am I)
export interface Player {
  id: string;
  sessionId: string;       // Session ID สำหรับ reconnection
  name: string;
  isHost: boolean;
  word?: string;
  score: number;           // คะแนนรวม
  hasAnswered: boolean;    // ตอบถูกแล้วในรอบนี้หรือยัง
  answerOrder?: number;    // ลำดับที่ตอบถูก (1, 2, 3, ...)
  isEliminated?: boolean;  // ถูกคัดออกจากรอบนี้ (ตอบผิด)
  isWaiting?: boolean;     // รอเข้าร่วมในรอบถัดไป (late join)
}

// Player with word visible (for other players to see)
export interface PlayerWithWord {
  id: string;
  name: string;
  word: string;
  score: number;
  hasAnswered: boolean;
  answerOrder?: number;
  isEliminated?: boolean;
}

// Game room state
export interface GameRoom {
  id: string;                     // Room ID (unique)
  name: string;                   // Room name
  password: string | null;        // Room password (null = no password)
  hostId: string;
  hostName: string;               // Host name for display in room list
  players: Player[];
  category: string | null;
  isPlaying: boolean;
  timerDuration: number; // in milliseconds
  timerStartedAt: number | null; // timestamp
  currentRound: number;           // รอบปัจจุบัน
  playedCategories: string[];     // หมวดที่เล่นไปแล้ว
  answeredCount: number;          // จำนวนคนที่ตอบถูกในรอบนี้
  roundFinished: boolean;         // รอบนี้จบแล้วหรือยัง
  gameType: GameType;             // ประเภทเกม
}

// Room info for room list (public info only)
export interface RoomInfo {
  id: string;
  name: string;
  hostName: string;
  playerCount: number;
  hasPassword: boolean;
  isPlaying: boolean;
  gameType: GameType;
}

// Game state for client
export type GameState = "room-list" | "creating-room" | "joining-room" | "lobby" | "playing" | "round-end";

// Room list response
export interface RoomListData {
  rooms: RoomInfo[];
}

// Room joined response
export interface RoomJoined {
  roomId: string;
  roomName: string;
  player: Player;
  isHost: boolean;
  gameType: GameType;
}

// Start game data
export interface StartGameData {
  category: string | null; // null = random category
  timerMinutes: number;
}

// Create room data
export interface CreateRoomData {
  roomName: string;
  password: string | null;
  playerName: string;
  sessionId: string;
  gameType: GameType;
}

// Join room data
export interface JoinRoomData {
  roomId: string;
  password: string | null;
  playerName: string;
  sessionId: string;
}

// Leave room data (for going back to room list)
export interface LeaveRoomData {
  roomId: string;
}

// Get room info data
export interface GetRoomInfoData {
  roomId: string;
}

// Rejoin request data
export interface RejoinData {
  sessionId: string;
}

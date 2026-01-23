// Player interface
export interface Player {
  id: string;
  sessionId: string;       // Session ID สำหรับ reconnection
  name: string;
  isHost: boolean;
  word?: string;
  score: number;           // คะแนนรวม
  hasAnswered: boolean;    // ตอบถูกแล้วในรอบนี้หรือยัง
  answerOrder?: number;    // ลำดับที่ตอบถูก (1, 2, 3, ...)
}

// Player with word visible (for other players to see)
export interface PlayerWithWord {
  id: string;
  name: string;
  word: string;
  score: number;
  hasAnswered: boolean;
  answerOrder?: number;
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
}

// Room info for room list (public info only)
export interface RoomInfo {
  id: string;
  name: string;
  hostName: string;
  playerCount: number;
  hasPassword: boolean;
  isPlaying: boolean;
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
}

// Game started data
export interface GameStartedData {
  category: string;
  otherPlayers: PlayerWithWord[];
  timerDuration: number;
  timerStartedAt: number;
  currentRound: number;
  playedCategories: string[];
}

// Start game data
export interface StartGameData {
  category: string | null; // null = random category
  timerMinutes: number;
}

// Player answered data
export interface PlayerAnsweredData {
  playerId: string;
  playerName: string;
  score: number;
  order: number;
  totalScore: number;
}

// Round ended data
export interface RoundEndedData {
  players: Player[];
  playedCategories: string[];
  currentRound: number;
}

// Rejoin success data
export interface RejoinSuccessData {
  roomId: string;
  roomName: string;
  player: Player;
  isHost: boolean;
  gameState: "lobby" | "playing" | "round-end";
  players: Player[];
  // Game data (if playing)
  category?: string;
  otherPlayers?: PlayerWithWord[];
  timerDuration?: number;
  timerStartedAt?: number;
  currentRound?: number;
  playedCategories?: string[];
}

// Rejoin request data
export interface RejoinData {
  sessionId: string;
}

// Create room data
export interface CreateRoomData {
  roomName: string;
  password: string | null;
  playerName: string;
  sessionId: string;
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

// Socket.io event types
export interface ServerToClientEvents {
  // Room list events
  roomList: (data: RoomListData) => void;
  roomJoined: (data: RoomJoined) => void;
  playersUpdate: (players: Player[]) => void;
  gameStarted: (data: GameStartedData) => void;
  roomClosed: () => void;
  leftRoom: () => void;
  wordRevealed: (word: string) => void;
  error: (message: string) => void;
  // Multi-round events
  playerAnswered: (data: PlayerAnsweredData) => void;
  roundEnded: (data: RoundEndedData) => void;
  // Reconnection events
  rejoinSuccess: (data: RejoinSuccessData) => void;
  rejoinFailed: (reason: string) => void;
}

export interface ClientToServerEvents {
  // Room list events
  getRoomList: () => void;
  createRoom: (data: CreateRoomData) => void;
  joinRoom: (data: JoinRoomData) => void;
  leaveRoom: (data: LeaveRoomData) => void;
  // Game events
  startGame: (data: StartGameData) => void;
  closeRoom: () => void;
  revealMyWord: () => void;
  // Multi-round events
  markCorrect: (playerId: string) => void;
  nextRound: (data: StartGameData) => void;
  // Reconnection events
  rejoin: (data: RejoinData) => void;
}

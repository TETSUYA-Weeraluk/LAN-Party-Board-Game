// Game type
export type GameType = "who-am-i" | "spy-fall";

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

// Spy Fall player interface
export interface SpyFallPlayer {
  id: string;
  sessionId: string;
  name: string;
  isHost: boolean;
  score: number;
  isSpy?: boolean;         // Is this player the spy?
  wins: number;            // จำนวนรอบที่ชนะ
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

// Game started data (Who Am I)
export interface GameStartedData {
  category: string;
  otherPlayers: PlayerWithWord[];
  timerDuration: number;
  timerStartedAt: number;
  currentRound: number;
  playedCategories: string[];
}

// Spy Fall game started data
export interface SpyFallGameStartedData {
  location: string | null;  // null if spy
  isSpy: boolean;
  timerDuration: number;
  timerStartedAt: number;
  currentRound: number;
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

// Spy Fall round ended data
export interface SpyFallRoundEndedData {
  players: SpyFallPlayer[];
  spyId: string;
  actualLocation: string;
  result: "spy-wins" | "spy-caught";
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
  gameType: GameType;
  // Who Am I game data (if playing)
  category?: string;
  otherPlayers?: PlayerWithWord[];
  timerDuration?: number;
  timerStartedAt?: number;
  currentRound?: number;
  playedCategories?: string[];
  // Spy Fall specific
  customLocations?: string[];
  myLocation?: string | null;
  isSpy?: boolean;
  spyId?: string;
  actualLocation?: string;
  roundResult?: "spy-wins" | "spy-caught";
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

// Add location data (Spy Fall)
export interface AddLocationData {
  location: string;
}

// Remove location data (Spy Fall)
export interface RemoveLocationData {
  location: string;
}

// Socket.io event types
export interface ServerToClientEvents {
  // Room list events
  roomList: (data: RoomListData) => void;
  roomJoined: (data: RoomJoined) => void;
  roomInfo: (data: RoomInfo | null) => void;
  playersUpdate: (players: Player[] | SpyFallPlayer[]) => void;
  gameStarted: (data: GameStartedData) => void;
  roomClosed: () => void;
  leftRoom: () => void;
  wordRevealed: (word: string) => void;
  error: (message: string) => void;
  // Multi-round events
  playerAnswered: (data: PlayerAnsweredData) => void;
  playerEliminated: (data: PlayerEliminatedData) => void;
  roundEnded: (data: RoundEndedData) => void;
  // Reconnection events
  rejoinSuccess: (data: RejoinSuccessData) => void;
  rejoinFailed: (reason: string) => void;
  // Spy Fall events
  locationsUpdate: (locations: string[]) => void;
  spyFallGameStarted: (data: SpyFallGameStartedData) => void;
  spyFallRoundEnded: (data: SpyFallRoundEndedData) => void;
}

export interface ClientToServerEvents {
  // Room list events
  getRoomList: () => void;
  getRoomInfo: (data: GetRoomInfoData) => void;
  createRoom: (data: CreateRoomData) => void;
  joinRoom: (data: JoinRoomData) => void;
  leaveRoom: (data: LeaveRoomData) => void;
  // Game events
  startGame: (data: StartGameData) => void;
  closeRoom: () => void;
  revealMyWord: () => void;
  // Multi-round events
  markCorrect: (playerId: string) => void;
  markWrong: (playerId: string) => void;
  nextRound: (data: StartGameData) => void;
  // Reconnection events
  rejoin: (data: RejoinData) => void;
  // Spy Fall events
  addLocation: (data: AddLocationData) => void;
  removeLocation: (data: RemoveLocationData) => void;
  startSpyFallGame: () => void;
  spyCaught: () => void;
  spyWins: () => void;
}

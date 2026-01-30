// Re-export all types from shared and game-specific modules
// This file is kept for backward compatibility with server.ts and other imports

// Shared types
export type {
  GameType,
  Player,
  PlayerWithWord,
  GameRoom,
  RoomInfo,
  GameState,
  RoomListData,
  RoomJoined,
  StartGameData,
  CreateRoomData,
  JoinRoomData,
  LeaveRoomData,
  GetRoomInfoData,
  RejoinData,
} from "./shared";

// Who Am I types
export type {
  GameStartedData,
  PlayerAnsweredData,
  PlayerEliminatedData,
  RoundEndedData,
} from "@/game/who-am-i/types";

// Spy Fall types
export type {
  SpyFallPlayer,
  SpyFallGameStartedData,
  SpyFallRoundEndedData,
  AddLocationData,
  RemoveLocationData,
  LocationsUpdateData,
} from "@/game/spy-fall/types";

// Undercover types
export type {
  UndercoverRole,
  UndercoverPlayer,
  UndercoverGameStartedData,
  UndercoverVoteResultData,
  UndercoverMrWhiteGuessResultData,
  UndercoverWinResult,
  UndercoverRoundEndedData,
  UndercoverVoteData,
  UndercoverMrWhiteGuessData,
} from "@/game/undercover/types";

// Import types for use in interfaces below
import type { Player, RoomInfo, RoomListData, RoomJoined, StartGameData, GetRoomInfoData, CreateRoomData, JoinRoomData, LeaveRoomData, RejoinData, GameType, PlayerWithWord } from "./shared";
import type { GameStartedData, PlayerAnsweredData, PlayerEliminatedData, RoundEndedData } from "@/game/who-am-i/types";
import type { SpyFallPlayer, SpyFallGameStartedData, SpyFallRoundEndedData, AddLocationData, RemoveLocationData, LocationsUpdateData } from "@/game/spy-fall/types";
import type { UndercoverRole, UndercoverPlayer, UndercoverGameStartedData, UndercoverVoteResultData, UndercoverMrWhiteGuessResultData, UndercoverWinResult, UndercoverRoundEndedData, UndercoverVoteData, UndercoverMrWhiteGuessData } from "@/game/undercover/types";

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
  excludedLocations?: string[];
  myLocation?: string | null;
  isSpy?: boolean;
  spyId?: string;
  actualLocation?: string;
  roundResult?: "spy-wins" | "spy-caught";
  // Undercover specific
  myRole?: UndercoverRole;
  myWord?: string | null;
  alivePlayers?: UndercoverPlayer[];
  spectators?: UndercoverPlayer[];
  civilianWord?: string;
  undercoverWord?: string;
  undercoverRoundResult?: UndercoverWinResult;
  waitingForMrWhiteGuess?: boolean;
  isYouGuessing?: boolean;
  currentTurnPlayerId?: string | null;
  currentTurnPlayerName?: string;
}

// Socket.io event types
export interface ServerToClientEvents {
  // Room list events
  roomList: (data: RoomListData) => void;
  roomJoined: (data: RoomJoined) => void;
  roomInfo: (data: RoomInfo | null) => void;
  playersUpdate: (players: Player[] | SpyFallPlayer[] | UndercoverPlayer[]) => void;
  gameStarted: (data: GameStartedData) => void;
  roomClosed: () => void;
  leftRoom: () => void;
  kicked: (reason: string) => void;
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
  locationsUpdate: (data: LocationsUpdateData) => void;
  spyFallGameStarted: (data: SpyFallGameStartedData) => void;
  spyFallRoundEnded: (data: SpyFallRoundEndedData) => void;
  // Undercover events
  undercoverGameStarted: (data: UndercoverGameStartedData) => void;
  undercoverVoteResult: (data: UndercoverVoteResultData) => void;
  undercoverMrWhiteGuessResult: (data: UndercoverMrWhiteGuessResultData) => void;
  undercoverRoundEnded: (data: UndercoverRoundEndedData) => void;
  undercoverPlayersUpdate: (data: { alivePlayers: UndercoverPlayer[]; spectators: UndercoverPlayer[] }) => void;
}

export interface ClientToServerEvents {
  // Room list events
  getRoomList: () => void;
  getRoomInfo: (data: GetRoomInfoData) => void;
  createRoom: (data: CreateRoomData) => void;
  joinRoom: (data: JoinRoomData) => void;
  leaveRoom: (data: LeaveRoomData) => void;
  kickPlayer: (data: { playerId: string }) => void;
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
  spyWrongGuess: () => void;
  // Undercover events
  toggleSpectator: (isSpectator: boolean) => void;
  startUndercoverGame: () => void;
  undercoverVote: (data: UndercoverVoteData) => void;
  undercoverMrWhiteGuess: (data: UndercoverMrWhiteGuessData) => void;
  undercoverSkipMrWhiteGuess: () => void;
  endUndercoverGame: () => void;
}

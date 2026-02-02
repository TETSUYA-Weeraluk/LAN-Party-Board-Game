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

// Guess Me types (เดิม Who Am I)
export type {
  GameStartedData,
  PlayerAnsweredData,
  PlayerEliminatedData,
  RoundEndedData,
} from "@/game/guess-me/types";

// Where Are We types (เดิม Spy Fall)
export type {
  SpyFallPlayer,
  SpyFallGameStartedData,
  SpyFallRoundEndedData,
  AddLocationData,
  RemoveLocationData,
  LocationsUpdateData,
} from "@/game/where-are-we/types";

// The Imposter types (เดิม Undercover)
export type {
  ImposterRole,
  ImposterPlayer,
  ImposterGameStartedData,
  ImposterVoteResultData,
  ImposterBlankGuessResultData,
  ImposterWinResult,
  ImposterRoundEndedData,
  ImposterVoteData,
  ImposterBlankGuessData,
} from "@/game/imposter/types";

// Import types for use in interfaces below
import type { Player, RoomInfo, RoomListData, RoomJoined, StartGameData, GetRoomInfoData, CreateRoomData, JoinRoomData, LeaveRoomData, RejoinData, GameType, PlayerWithWord } from "./shared";
import type { GameStartedData, PlayerAnsweredData, PlayerEliminatedData, RoundEndedData } from "@/game/guess-me/types";
import type { SpyFallPlayer, SpyFallGameStartedData, SpyFallRoundEndedData, AddLocationData, RemoveLocationData, LocationsUpdateData } from "@/game/where-are-we/types";
import type { ImposterRole, ImposterPlayer, ImposterGameStartedData, ImposterVoteResultData, ImposterBlankGuessResultData, ImposterWinResult, ImposterRoundEndedData, ImposterVoteData, ImposterBlankGuessData } from "@/game/imposter/types";

// Rejoin success data
export interface RejoinSuccessData {
  roomId: string;
  roomName: string;
  player: Player;
  isHost: boolean;
  gameState: "lobby" | "playing" | "round-end";
  players: Player[];
  gameType: GameType;
  // Guess Me game data (if playing)
  category?: string;
  otherPlayers?: PlayerWithWord[];
  timerDuration?: number;
  timerStartedAt?: number;
  currentRound?: number;
  playedCategories?: string[];
  // Where Are We specific
  customLocations?: string[];
  excludedLocations?: string[];
  myLocation?: string | null;
  isSpy?: boolean;
  spyId?: string;
  actualLocation?: string;
  roundResult?: "spy-wins" | "spy-caught";
  // The Imposter specific
  myRole?: ImposterRole;
  myWord?: string | null;
  alivePlayers?: ImposterPlayer[];
  spectators?: ImposterPlayer[];
  citizenWord?: string;
  imposterWord?: string;
  imposterRoundResult?: ImposterWinResult;
  waitingForBlankGuess?: boolean;
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
  playersUpdate: (players: Player[] | SpyFallPlayer[] | ImposterPlayer[]) => void;
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
  // Where Are We events
  locationsUpdate: (data: LocationsUpdateData) => void;
  spyFallGameStarted: (data: SpyFallGameStartedData) => void;
  spyFallRoundEnded: (data: SpyFallRoundEndedData) => void;
  // The Imposter events
  imposterGameStarted: (data: ImposterGameStartedData) => void;
  imposterVoteResult: (data: ImposterVoteResultData) => void;
  imposterBlankGuessResult: (data: ImposterBlankGuessResultData) => void;
  imposterRoundEnded: (data: ImposterRoundEndedData) => void;
  imposterPlayersUpdate: (data: { alivePlayers: ImposterPlayer[]; spectators: ImposterPlayer[] }) => void;
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
  // Where Are We events
  addLocation: (data: AddLocationData) => void;
  removeLocation: (data: RemoveLocationData) => void;
  startSpyFallGame: () => void;
  spyCaught: () => void;
  spyWins: () => void;
  spyWrongGuess: () => void;
  // The Imposter events
  toggleSpectator: (isSpectator: boolean) => void;
  startImposterGame: () => void;
  imposterVote: (data: ImposterVoteData) => void;
  imposterBlankGuess: (data: ImposterBlankGuessData) => void;
  imposterSkipBlankGuess: () => void;
  endImposterGame: () => void;
}

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

// Spy Fall game started data
export interface SpyFallGameStartedData {
  location: string | null;  // null if spy
  isSpy: boolean;
  timerDuration: number;
  timerStartedAt: number;
  currentRound: number;
}

// Spy Fall round result type
export type SpyFallRoundResult = "spy-wins" | "spy-caught" | "spy-wrong-guess";

// Spy Fall round ended data
export interface SpyFallRoundEndedData {
  players: SpyFallPlayer[];
  spyId: string;
  actualLocation: string;
  result: SpyFallRoundResult;
  currentRound: number;
}

// Add location data (Spy Fall)
export interface AddLocationData {
  location: string;
}

// Remove location data (Spy Fall)
export interface RemoveLocationData {
  location: string;
}

// Locations update data (Spy Fall)
export interface LocationsUpdateData {
  customLocations: string[];
  excludedLocations: string[];
}

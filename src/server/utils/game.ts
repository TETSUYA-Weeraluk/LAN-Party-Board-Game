// Game logic utilities

import type { ImposterRole, ImposterWinResult } from "@/types/game";
import type { ImposterGameRoom } from "../types";
import { CATEGORY_LIST, PRESET_CATEGORIES } from "@/game/guess-me/constants";
import { SPYFALL_LOCATIONS } from "@/game/where-are-we/constants";
import { imposterWords } from "@/game/imposter/constants";

// Calculate score based on answer order (Guess Me)
export function calculateScore(order: number): number {
  if (order === 1) return 3;
  if (order === 2) return 2;
  if (order === 3) return 1;
  return 0;
}

// Generate words from preset categories (Guess Me)
export function generateWordsFromPreset(
  category: string,
  playerCount: number
): string[] {
  const preset = PRESET_CATEGORIES.find((p) => p.name === category);

  if (preset) {
    const shuffled = [...preset.words].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, playerCount);
  }

  const fallback = PRESET_CATEGORIES[0];
  const shuffled = [...fallback.words].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, playerCount);
}

// Generate random category from preset list (excluding already played)
export function generateRandomCategory(playedCategories: string[]): string {
  const availableCategories = CATEGORY_LIST.filter(
    (cat) => !playedCategories.includes(cat)
  );
  const categoriesToUse =
    availableCategories.length > 0 ? availableCategories : CATEGORY_LIST;
  const randomIndex = Math.floor(Math.random() * categoriesToUse.length);
  return categoriesToUse[randomIndex];
}

// Get random location for Where Are We
export function getRandomLocation(customLocations: string[], excludedLocations: string[]): string {
  const allLocations = [...SPYFALL_LOCATIONS, ...customLocations].filter(
    (loc) => !excludedLocations.includes(loc)
  );
  if (allLocations.length === 0) {
    return SPYFALL_LOCATIONS[0];
  }
  const randomIndex = Math.floor(Math.random() * allLocations.length);
  return allLocations[randomIndex];
}

// Role distribution table for The Imposter (citizen, imposter, blank)
export const IMPOSTER_ROLE_DISTRIBUTION: Record<
  number,
  { citizens: number; imposters: number; blanks: number }
> = {
  3: { citizens: 2, imposters: 1, blanks: 0 },
  4: { citizens: 2, imposters: 1, blanks: 1 },
  5: { citizens: 3, imposters: 1, blanks: 1 },
  6: { citizens: 4, imposters: 1, blanks: 1 },
  7: { citizens: 5, imposters: 1, blanks: 1 },
  8: { citizens: 5, imposters: 2, blanks: 1 },
  9: { citizens: 6, imposters: 2, blanks: 1 },
  10: { citizens: 7, imposters: 2, blanks: 1 },
};

// Get random word pair for The Imposter (excluding used pairs)
export function getRandomImposterWords(
  usedIndices: number[] = []
): { citizen: string; imposter: string; index: number } {
  const availableIndices = imposterWords
    .map((_, index) => index)
    .filter((index) => !usedIndices.includes(index));
  const indicesToUse =
    availableIndices.length > 0
      ? availableIndices
      : imposterWords.map((_, index) => index);
  const randomIndex = indicesToUse[Math.floor(Math.random() * indicesToUse.length)];
  const wordPair = imposterWords[randomIndex];
  return {
    citizen: wordPair.citizen,
    imposter: wordPair.imposter,
    index: randomIndex,
  };
}

// Distribute roles for The Imposter game
export function distributeImposterRoles(playerCount: number): ImposterRole[] {
  const distribution = IMPOSTER_ROLE_DISTRIBUTION[playerCount];
  if (!distribution) return [];

  const roles: ImposterRole[] = [];
  for (let i = 0; i < distribution.citizens; i++) {
    roles.push("citizen");
  }
  for (let i = 0; i < distribution.imposters; i++) {
    roles.push("imposter");
  }
  for (let i = 0; i < distribution.blanks; i++) {
    roles.push("blank");
  }
  return roles.sort(() => Math.random() - 0.5);
}

// Check win condition for The Imposter
export function checkImposterWinCondition(
  room: ImposterGameRoom
): ImposterWinResult | null {
  const alivePlayers = room.players.filter((p) => p.isAlive && !p.isSpectator);
  const aliveImposterCount = alivePlayers.filter((p) => p.role === "imposter").length;
  const aliveBlankCount = alivePlayers.filter((p) => p.role === "blank").length;
  const aliveCitizenCount = alivePlayers.filter((p) => p.role === "citizen").length;

  if (aliveImposterCount === 0 && aliveBlankCount === 0) {
    return "citizen-win";
  }
  if (aliveImposterCount >= aliveCitizenCount) {
    return "imposter-win";
  }
  return null;
}

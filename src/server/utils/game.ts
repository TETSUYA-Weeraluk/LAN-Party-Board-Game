// Game logic utilities

import type { UndercoverRole, UndercoverWinResult } from "@/types/game";
import type { UndercoverGameRoom } from "../types";
import { CATEGORY_LIST, PRESET_CATEGORIES } from "@/game/who-am-i/constants";
import { SPYFALL_LOCATIONS } from "@/game/spy-fall/constants";
import { undercoverWords } from "@/game/undercover/constants";

// Calculate score based on answer order (Who Am I)
export function calculateScore(order: number): number {
  if (order === 1) return 3;
  if (order === 2) return 2;
  if (order === 3) return 1;
  return 0;
}

// Generate words from preset categories (Who Am I)
export function generateWordsFromPreset(
  category: string,
  playerCount: number
): string[] {
  const preset = PRESET_CATEGORIES.find((p) => p.name === category);

  if (preset) {
    // Shuffle and pick words from preset
    const shuffled = [...preset.words].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, playerCount);
  }

  // Fallback: if category not found, use first preset
  const fallback = PRESET_CATEGORIES[0];
  const shuffled = [...fallback.words].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, playerCount);
}

// Generate random category from preset list (excluding already played)
export function generateRandomCategory(playedCategories: string[]): string {
  // Filter out already played categories
  const availableCategories = CATEGORY_LIST.filter(
    (cat) => !playedCategories.includes(cat)
  );

  // If all categories played, reset and use all
  const categoriesToUse =
    availableCategories.length > 0 ? availableCategories : CATEGORY_LIST;

  // Pick random category
  const randomIndex = Math.floor(Math.random() * categoriesToUse.length);
  const selectedCategory = categoriesToUse[randomIndex];

  console.log("RandomCategory:", selectedCategory);

  return selectedCategory;
}

// Get random location for Spy Fall
export function getRandomLocation(customLocations: string[], excludedLocations: string[]): string {
  const allLocations = [...SPYFALL_LOCATIONS, ...customLocations].filter(
    (loc) => !excludedLocations.includes(loc)
  );
  if (allLocations.length === 0) {
    // Fallback if all locations are excluded
    return SPYFALL_LOCATIONS[0];
  }
  const randomIndex = Math.floor(Math.random() * allLocations.length);
  return allLocations[randomIndex];
}

// Role distribution table for Undercover
export const UNDERCOVER_ROLE_DISTRIBUTION: Record<
  number,
  { civilians: number; undercover: number; mrwhite: number }
> = {
  3: { civilians: 2, undercover: 1, mrwhite: 0 },
  4: { civilians: 2, undercover: 1, mrwhite: 1 },
  5: { civilians: 3, undercover: 1, mrwhite: 1 },
  6: { civilians: 4, undercover: 1, mrwhite: 1 },
  7: { civilians: 5, undercover: 1, mrwhite: 1 },
  8: { civilians: 5, undercover: 2, mrwhite: 1 },
  9: { civilians: 6, undercover: 2, mrwhite: 1 },
  10: { civilians: 7, undercover: 2, mrwhite: 1 },
};

// Get random word pair for Undercover (excluding used pairs)
export function getRandomUndercoverWords(
  usedIndices: number[] = []
): { civilians: string; undercover: string; index: number } {
  // Filter out used indices
  const availableIndices = undercoverWords
    .map((_, index) => index)
    .filter((index) => !usedIndices.includes(index));

  // If all words used, reset and use all
  const indicesToUse =
    availableIndices.length > 0
      ? availableIndices
      : undercoverWords.map((_, index) => index);

  const randomIndex = indicesToUse[Math.floor(Math.random() * indicesToUse.length)];
  const wordPair = undercoverWords[randomIndex];

  return {
    civilians: wordPair.civilians,
    undercover: wordPair.undercover,
    index: randomIndex,
  };
}

// Distribute roles for Undercover game
export function distributeUndercoverRoles(playerCount: number): UndercoverRole[] {
  const distribution = UNDERCOVER_ROLE_DISTRIBUTION[playerCount];
  if (!distribution) {
    // Default for unsupported player counts
    return [];
  }

  const roles: UndercoverRole[] = [];

  // Add roles based on distribution
  for (let i = 0; i < distribution.civilians; i++) {
    roles.push("civilian");
  }
  for (let i = 0; i < distribution.undercover; i++) {
    roles.push("undercover");
  }
  for (let i = 0; i < distribution.mrwhite; i++) {
    roles.push("mrwhite");
  }

  // Shuffle roles
  return roles.sort(() => Math.random() - 0.5);
}

// Check win condition for Undercover
export function checkUndercoverWinCondition(
  room: UndercoverGameRoom
): UndercoverWinResult | null {
  const alivePlayers = room.players.filter((p) => p.isAlive && !p.isSpectator);

  const aliveUndercoverCount = alivePlayers.filter(
    (p) => p.role === "undercover"
  ).length;
  const aliveMrWhiteCount = alivePlayers.filter(
    (p) => p.role === "mrwhite"
  ).length;
  const aliveCivilianCount = alivePlayers.filter(
    (p) => p.role === "civilian"
  ).length;

  // Civilian wins: No undercover or mr.white left
  if (aliveUndercoverCount === 0 && aliveMrWhiteCount === 0) {
    return "civilian-win";
  }

  // Undercover wins: undercover count >= civilian count
  if (aliveUndercoverCount >= aliveCivilianCount) {
    return "undercover-win";
  }

  return null;
}

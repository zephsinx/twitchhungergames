/**
 * Core type definitions for Twitch Hunger Games.
 */

/**
 * Player in the game. Can be a real Twitch user or a fake player added for testing/debugging.
 */
export interface Player {
  username: string;
  /** Hex color format (e.g., "#ff0000") */
  color: string;
  avatar: string;
  alive: boolean;
  kills: number;
  /** Only set when player is dead */
  deathDay?: number;
  /** Only present for real players with Twitch accounts */
  twitchUserId?: string;
  isRealPlayer: boolean;
}

/**
 * Event template from JSON data files. Raw event definitions before processing.
 */
export interface EventTemplate {
  /** Placeholders: {0}, {1} for players; {weapon_any}, {liquid_any}, etc. for items */
  msg: string;
  tributes: number;
  /** 0-based participant indices */
  killed?: number[];
  /** 0-based participant indices, or null for environmental deaths */
  killer?: number[] | null;
  hidden?: boolean;
  /** Higher weight = more likely to be selected */
  weight?: number;
  /** Custom handler function name in event-handlers.js */
  customHandler?: string;
  /** Special ordering (e.g., -1 for early execution) */
  order?: number;
}

/**
 * Processed event at runtime. EventTemplate with actual players selected and placeholders replaced.
 */
export interface ProcessedEvent {
  picks: Player[];
  /** Placeholders replaced with actual values */
  text: string;
  /** 0-based participant indices */
  killed: number[];
  /** 0-based participant indices */
  killer: number[];
  hidden: boolean;
}

/**
 * Complete game state.
 */
export interface GameState {
  participants: Player[];
  currentDay: number;
  /** 0=bloodbath, 1=day, 2=fallen, 3=night */
  stage: number;
  /** Days since last feast/arena event */
  daysSinceEvent: number;
  consecutiveNoDeaths: number;
  killedThisDay: string[];
  eliminationOrder: string[];
  /** HTML log of death events */
  deathEventsLog: string[];
  revealedDeaths: Set<string>;
  revealedAlive: Set<string>;
  /** "bloodbath" | "day" | "night" | "feast" | "arena" | null */
  currentPhaseType: string | null;
  gameStarted: boolean;
}

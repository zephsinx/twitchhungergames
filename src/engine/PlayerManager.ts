import { Player } from "../types";

/**
 * Manages player collection and state.
 */
export class PlayerManager {
  private players: Map<string, Player>;

  constructor() {
    this.players = new Map();
  }

  /**
   * Adds a player to the collection.
   * @throws Error if player with same username already exists
   */
  addPlayer(player: Player): void {
    if (this.players.has(player.username)) {
      throw new Error(
        `Player with username "${player.username}" already exists`
      );
    }
    this.players.set(player.username, { ...player });
  }

  /**
   * Removes a player by username.
   * No-op if player doesn't exist.
   */
  removePlayer(username: string): void {
    this.players.delete(username);
  }

  /**
   * Gets a player by username.
   * @returns Player if found, undefined otherwise
   */
  getPlayer(username: string): Player | undefined {
    const player = this.players.get(username);
    return player ? { ...player } : undefined;
  }

  /**
   * Gets all alive players.
   * @returns New array of alive players
   */
  getAlivePlayers(): Player[] {
    return Array.from(this.players.values()).filter((p) => p.alive);
  }

  /**
   * Gets all dead players.
   * @returns New array of dead players
   */
  getDeadPlayers(): Player[] {
    return Array.from(this.players.values()).filter((p) => !p.alive);
  }

  /**
   * Updates a player with partial data.
   * @throws Error if player doesn't exist
   */
  updatePlayer(username: string, updates: Partial<Player>): void {
    const player = this.players.get(username);
    if (!player) {
      throw new Error(`Player with username "${username}" not found`);
    }

    if (updates.username !== undefined && updates.username !== username) {
      throw new Error("Cannot change player username");
    }

    if (updates.alive !== undefined) {
      if (updates.alive === false) {
      } else if (updates.alive === true) {
        updates.deathDay = undefined;
      }
    }

    const updatedPlayer: Player = {
      ...player,
      ...updates,
    };

    this.players.set(username, updatedPlayer);
  }

  /**
   * Gets all players.
   * @returns New array of all players
   */
  getAllPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  /**
   * Resets the player manager, clearing all players.
   */
  reset(): void {
    this.players.clear();
  }

  /**
   * Checks if a player exists.
   */
  hasPlayer(username: string): boolean {
    return this.players.has(username);
  }

  /**
   * Gets the total number of players.
   */
  getPlayerCount(): number {
    return this.players.size;
  }

  /**
   * Gets the count of alive players.
   */
  getAliveCount(): number {
    return this.getAlivePlayers().length;
  }
}

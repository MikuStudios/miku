import { inject } from "inversify";
import type { LavalinkNodeOptions } from "lavalink-client";
import { Cache } from "#miku/structures";
import type { NonResumableOptions, PlayerDataJson } from "#miku/types";

/**
 * This class is used to manage the sessions of the players.
 * The original code is from the Stelle Music bot.
 *
 * @credits GanyuStudios
 * @source https://github.com/Ganyu-Studios/stelle-music/
 */
export class Sessions {
    @inject(Cache) private storage!: Cache;
    public nodes = new Map<string, string>();

    /**
     * Initializes the session nodes by fetching session data from storage.
     *
     * @returns {Promise<void>} A promise that resolves when the initialization is complete.
     */
    public async initialize(): Promise<void> {
        this.nodes = new Map(
            Object.entries((await this.storage.getValues<PlayerDataJson>("sessions")) ?? []).map(([_, session]) => [
                session.nodeId!,
                session.nodeSessionId!,
            ]),
        );
    }

    /**
     * Sets an object in the storage for a specific guild.
     *
     * @template T - The type of the object to be stored.
     * @param {string} guildId - The ID of the guild.
     * @param {T} object - The object to be stored.
     * @returns {Promise<void>} A promise that resolves when the object is set in the storage.
     */
    public set<T>(guildId: string, object: T): Promise<string | null> {
        return this.storage.set<T>(`sessions:${guildId}`, object);
    }

    /**
     * Retrieves a list of sessions for a given guild.
     *
     * @template T - The type of the sessions.
     * @param guildId - The ID of the guild to retrieve sessions for.
     * @returns A promise that resolves to an array of sessions of type T, or null if no sessions are found.
     */
    public get<T>(guildId: string): Promise<T | null> {
        return this.storage.get<T>(`sessions:${guildId}`);
    }

    /**
     * Deletes the session associated with the given guild ID.
     *
     * @param guildId - The ID of the guild whose session is to be deleted.
     * @returns A promise that resolves to the number of deleted sessions.
     */
    public delete(guildId: string): Promise<number> {
        return this.storage.delete(`sessions:${guildId}`);
    }

    /**
     * Resolves the given array of non-resumable nodes to an array of Lavalink node options.
     *
     * @param nodes - An array of non-resumable node options to be resolved.
     * @returns A promise that resolves to an array of Lavalink node options.
     */
    public async resolve(nodes: NonResumableOptions[]): Promise<LavalinkNodeOptions[]> {
        await this.initialize();

        return nodes.map((node) => ({
            ...node,
            sessionId: this.nodes.get(node.id ?? `${node.host}:${node.port}`),
        }));
    }
}

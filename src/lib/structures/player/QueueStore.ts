import { inject } from "inversify";
import type { QueueStoreManager, StoredQueue } from "lavalink-client";
import { Cache } from "#miku/structures";

export class QueueStore implements QueueStoreManager {
    @inject(Cache) private storage!: Cache;

    /**
     * Sets the queue for a specific guild in the cache.
     *
     * @param guildId - The unique identifier of the guild.
     * @param value - The queue to be stored, which can be of type `StoredQueue` or a string.
     * @returns A promise that resolves when the queue is successfully set in the cache.
     */
    public set(guildId: string, value: StoredQueue | string): Promise<any> {
        return this.storage.set<StoredQueue | string>(`queue:${guildId}`, value);
    }

    /**
     * Retrieves the stored queue for a given guild from the cache.
     *
     * @param guildId - The unique identifier of the guild.
     * @returns A promise that resolves to the stored queue for the specified guild.
     */
    public get(guildId: string): Promise<any> {
        return this.storage.get<StoredQueue>(`queue:${guildId}`);
    }

    /**
     * Deletes the queue associated with the given guild ID from the cache.
     *
     * @param guildId - The ID of the guild whose queue is to be deleted.
     * @returns A promise that resolves when the queue is successfully deleted.
     */
    public delete(guildId: string): Promise<any> {
        return this.storage.delete(`queue:${guildId}`);
    }

    /**
     * Converts the given value to a string representation if it is not already a string.
     *
     * @param value - The value to be converted, which can be of type `StoredQueue` or `string`.
     * @returns A promise that resolves to the input value, either as a `StoredQueue` or a `string`.
     */
    public async stringify(value: StoredQueue | string): Promise<StoredQueue | string> {
        if (typeof value === "string") {
            return value;
        }
        return JSON.stringify(value);
    }

    /**
     * Parses the given value into a Partial<StoredQueue> object.
     *
     * @param value - The value to be parsed, which can be either a StoredQueue object or a JSON string representation of it.
     * @returns A promise that resolves to a Partial<StoredQueue> object.
     */
    public async parse(value: StoredQueue | string): Promise<Partial<StoredQueue>> {
        if (typeof value === "string") {
            return JSON.parse(value);
        }
        return value;
    }
}

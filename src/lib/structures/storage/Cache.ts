import zlib from "node:zlib";
import { inject, injectable } from "inversify";
import { Redis } from "ioredis";
import { CoreClient } from "#miku/structures";

const buildKey = (key: string) => `miku:${key}`;

@injectable()
export class Cache {
    @inject(CoreClient) private readonly _client!: CoreClient;

    readonly redis = new Redis({
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
    });

    public constructor() {
        this.redis.on("error", (error) => this._client.logger.error(`Redis error: ${error}`));
        this.redis.on("ready", () => this._client.logger.info("Connected to Redis."));
    }

    /**
     * Stores a key-value pair in Redis with compression.
     * @param key - The key to store the object under.
     * @param object - The object to store.
     * @returns A promise that resolves when the operation is complete.
     */
    public set<T>(key: string, object: T): Promise<string | null> {
        const serialized = JSON.stringify(object);
        const compressed = zlib.deflateRawSync(serialized).toString("base64");
        return this.redis.set(buildKey(key), compressed);
    }

    /**
     * Retrieves a value from Redis and decompresses it.
     * @param key - The key to retrieve.
     * @returns A promise resolving to the parsed object or null if not found.
     */
    public async get<T>(key: string): Promise<T | null> {
        const deserialized = await this.redis.get(buildKey(key));
        if (!deserialized) return null;

        return JSON.parse(zlib.inflateRawSync(Buffer.from(deserialized, "base64")).toString()) as T;
    }

    /**
     * Deletes a key from Redis.
     * @param key - The key to delete.
     * @returns A promise resolving to the number of keys deleted.
     */
    public delete(key: string): Promise<number> {
        return this.redis.del(buildKey(key));
    }

    /**
     * Retrieves all values associated with a given key pattern.
     * @param key - The key pattern to match.
     * @returns A promise resolving to an array of values or null if none found.
     */
    public async getValues<T>(key: string): Promise<T[] | null> {
        const keys = await this.redis.keys(buildKey(`${key}:*`));
        if (!keys.length) return null;

        const values = await this.redis.mget(keys);
        return values
            .filter((value): value is string => value !== null)
            .map((value) => JSON.parse(zlib.inflateRawSync(Buffer.from(value, "base64")).toString()) as T);
    }

    /**
     * Sets a list of values in Redis under a given key.
     * @param listKey - The key under which to store the list.
     * @param objects - The array of objects to store.
     * @returns A promise that resolves when the operation is complete.
     */
    public async setList<T>(listKey: string, objects: T[]): Promise<void> {
        const builtListKey = buildKey(listKey);
        await this.redis.del(builtListKey);

        if (objects.length > 0) {
            const compressedObjects = objects.map((obj) => zlib.deflateRawSync(JSON.stringify(obj)).toString("base64"));
            await this.redis.rpush(builtListKey, ...compressedObjects);
        }
    }

    /**
     * Adds an object to the beginning of a Redis list.
     * @param listKey - The key under which the list is stored.
     * @param object - The object to add to the list.
     * @returns A promise resolving to the new length of the list.
     */
    public async addList<T>(listKey: string, object: T): Promise<number> {
        const builtListKey = buildKey(listKey);
        const compressedObject = zlib.deflateRawSync(JSON.stringify(object)).toString("base64");
        return this.redis.lpush(builtListKey, compressedObject);
    }

    /**
     * Retrieves all values from a Redis list and decompresses them.
     * @param listKey - The key of the list.
     * @returns A promise resolving to an array of parsed objects.
     */
    public async getList<T>(listKey: string): Promise<T[]> {
        const builtListKey = buildKey(listKey);
        const listValues = await this.redis.lrange(builtListKey, 0, -1);
        return listValues.map((value) => JSON.parse(zlib.inflateRawSync(Buffer.from(value, "base64")).toString()) as T);
    }

    /**
     * Deletes an entire Redis list.
     * @param listKey - The key of the list to delete.
     * @returns A promise resolving to the number of keys removed.
     */
    public async deleteList(listKey: string): Promise<number> {
        const builtListKey = buildKey(listKey);
        return this.redis.del(builtListKey);
    }
}

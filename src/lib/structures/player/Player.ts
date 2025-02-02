import { inject } from "inversify";
import { LavalinkManager } from "lavalink-client";
import { container } from "#miku/inversify";
import { QueueStore, Sessions } from "#miku/structures";
import { CoreClient } from "#miku/structures";
import { autoPlayFunction, requesterTransformer } from "#miku/utils";

export class MusicManager extends LavalinkManager {
    @inject(CoreClient) private readonly _client!: CoreClient;

    private initialized = false;

    constructor() {
        super({
            nodes: [],
            sendToShard: (id, packet) => {
                const shardId = this._client.gateway.calculateShardId(id);
                return this._client.gateway.send(shardId, packet);
            },
            emitNewSongsOnly: true,
            queueOptions: {
                maxPreviousTracks: 20,
                queueStore: container.get(QueueStore),
            },
            playerOptions: {
                requesterTransformer,
                defaultSearchPlatform: "spsearch",
                onDisconnect: {
                    destroyPlayer: true,
                },
                onEmptyQueue: {
                    autoPlayFunction,
                },
            },
        });
    }

    /**
     * Initializes the music player by resolving and creating nodes.
     * (fuck you awaitable thing)
     * @returns {Promise<void>} A promise that resolves when the player has been successfully started.
     */
    public async initialize(): Promise<void> {
        if (this.initialized) return;

        const sessions = container.get(Sessions);
        const nodes = await sessions.resolve([
            {
                id: process.env.LAVALINK_BACKUP_ID,
                host: process.env.LAVALINK_BACKUP_HOST!,
                port: Number(process.env.LAVALINK_BACKUP_PORT),
                authorization: process.env.LAVALINK_BACKUP_AUTH!,
                secure: false,
                requestSignalTimeoutMS: 3000,
                closeOnError: true,
                heartBeatInterval: 30_000,
                enablePingOnStatsCheck: true,
                retryDelay: 10e3,
                retryAmount: 5,
            },
        ]);

        this.initialized = true;

        for (const node of nodes) {
            this.nodeManager.createNode(node);
        }
    }

    /**
     * Searches for music tracks based on the given query and source platform.
     *
     * @param query - The search query string.
     * @param source - The platform to search on.
     * @returns A promise that resolves with the search results.
     */
    public search(query: string, requestUser: unknown) {
        const nodes = this.nodeManager.leastUsedNodes();
        const node = nodes[Math.floor(Math.random() * nodes.length)];

        return node.search({ query }, requestUser);
    }
}

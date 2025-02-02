import { RedisAdapter } from "@slipher/redis-adapter";
import { injectable } from "inversify";
import { Client } from "seyfert";
import { container } from "#miku/inversify";
import { middlewares } from "#miku/middlewares";
import { onMiddlewaresError, onRunError } from "#miku/utils";
import { config } from "../utils/config.js";

@injectable()
export class CoreClient extends Client<true> {
    public readonly config = config;

    constructor() {
        super({
            commands: {
                defaults: {
                    onRunError,
                    onMiddlewaresError,
                },
            },
            components: {
                defaults: {
                    onRunError,
                    onMiddlewaresError,
                },
            },
        });
    }

    /**
     * Initializes the client by setting up services and starting the client.
     * 
     * This method performs the following actions:
     * - Sets up services including middlewares and cache with a Redis adapter.
     * - Configures which caches should be disabled.
     * - Sets up command and subcommand resolution if commands are available.
     * - Sets up component callback resolution if components are available.
     * - Starts the client.
     * 
     * @returns {Promise<void>} A promise that resolves when the client has been started.
     */
    public initialize(): Promise<void> {
        this.setServices({
            middlewares,
            cache: {
                adapter: new RedisAdapter({
                    redisOptions: {
                        url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
                    },
                }),
                disabledCache: {
                    emojis: true,
                    stickers: true,
                    presences: true,
                    overwrites: true,
                    messages: true,
                    stageInstances: true,
                    roles: true,
                    bans: true,
                },
            },
        });
        if (this.commands) {
            this.commands.onCommand = (file) => container.resolve(file);
            this.commands.onSubCommand = (file) => container.resolve(file);
        }
        if (this.components) this.components.callback = (file) => container.resolve(file);
        return this.start();
    }
}

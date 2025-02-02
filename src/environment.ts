import type { ParseClient, ParseMiddlewares } from "seyfert";
import type { middlewares } from "#miku/middlewares";
import type { CoreClient } from "#miku/structures";

declare module "seyfert" {
    interface UsingClient extends ParseClient<CoreClient> {}
    interface RegisteredMiddlewares extends ParseMiddlewares<typeof middlewares> {}
    interface InternalOptions {
        asyncCache: true;
    }
    interface ExtendedRCLocations {
        lavalink: string;
    }
}

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            DISCORD_TOKEN: string;
            DATABASE_URL: string;
            LOGS_CHANNEL: string;

            REDIS_USERNAME: string;
            REDIST_HOST: string;
            REDIS_PORT: number;
            REDIS_PASSWORD: string;

            LAVALINK_MAIN_ID: string;
            LAVALINK_MAIN_HOST: string;
            LAVALINK_MAIN_PORT: string;
            LAVALINK_MAIN_AUTH: string;

            LAVALINK_BACKUP_ID: string;
            LAVALINK_BACKUP_HOST: string;
            LAVALINK_BACKUP_PORT: string;
            LAVALINK_BACKUP_AUTH: string;
        }
    }
}

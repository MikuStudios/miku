import { config } from "seyfert";
import { GatewayIntentBits } from "seyfert/lib/types/index.js";

export default config.bot({
    debug: true,
    token: process.env.DISCORD_TOKEN,
    intents: [GatewayIntentBits.GuildVoiceStates],
    /**
     * @type {import("seyfert").RuntimeConfig["locations"] & { lavalink: string }}
     */
    locations: {
        base: "dist",
        commands: "commands",
        events: "events",
        lavalink: "lavalink",
        components: "components",
    },
});
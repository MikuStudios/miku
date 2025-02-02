import { container } from "#miku/inversify";
import { Sessions } from "#miku/structures";
import { CoreClient, Lavalink } from "#miku/structures";

export default new Lavalink({
    name: "playerDestroy",
    type: "manager",
    run: async (player) => {
        const client = container.get(CoreClient);
        const sessions = container.get(Sessions);

        await sessions.delete(player.guildId);

        const debugEnabled = (await client.getRC()).debug;

        return debugEnabled && client.logger.debug(`Player at ${player.guildId} has been destroyed.`);
    },
});

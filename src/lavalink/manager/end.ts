import { container } from "#miku/inversify";
import { CoreClient, Lavalink } from "#miku/structures";

export default new Lavalink({
    name: "trackEnd",
    type: "manager",
    run: async (player) => {
        if (!player.textChannelId) return;

        const client = container.get(CoreClient);

        const messageId = player.get<string | undefined>("messageId");
        if (!messageId) return client.logger.debug("No message ID found in player data. Skipping...");

        client.logger.debug(`Attempting to delete message with ID ${messageId}...`);

        try {
            await client.messages.delete(messageId, player.textChannelId);
            client.logger.debug(`Message with ID ${messageId} has been deleted.`);
        } catch (error) {
            client.logger.error(`Error while trying to delete the message with ID ${messageId}: ${error}`);
        }
    },
});

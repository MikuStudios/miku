import { createEvent } from "seyfert";
import { container } from "#miku/inversify";
import { MusicManager } from "#miku/structures";

export default createEvent({
    data: {
        name: "botReady",
        once: true,
    },
    run: async (user, client) => {
        await client.uploadCommands({ cachePath: "commands.json" });

        const manager = container.get(MusicManager);
        await manager.init({ id: user.id, username: user.username });

        return client.logger.info(`Logged in as ${user.username}`);
    },
});

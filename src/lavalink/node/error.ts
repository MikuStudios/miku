import { container } from "#miku/inversify";
import { CoreClient, Lavalink } from "#miku/structures";

export default new Lavalink({
    name: "error",
    type: "node",
    run: (node, error, payload) => {
        const client = container.get(CoreClient);
        client.logger.error(`Lavalink - Node ${node.id} encountered an error:`, error);
        client.logger.error(`Lavalink - Node ${node.id} Payload:`, payload);
    },
});

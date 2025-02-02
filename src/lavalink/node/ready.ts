import { container } from "#miku/inversify";
import { MusicManager } from "#miku/structures";
import { CoreClient, Lavalink } from "#miku/structures";

export default new Lavalink({
    name: "connect",
    type: "node",
    run: async (node) => {
        const manager = container.get(MusicManager);
        const client = container.get(CoreClient);

        const players = [...manager.players.values()].filter((player) => player.node.id === node.id);
        for (const player of players) {
            try {
                await player.queue.utils.sync(true, true);
                await player.play({
                    track: player.queue.current ?? undefined,
                    paused: player.paused,
                    volume: player.volume,
                    position: player.position,
                    voice: player.voice,
                });
            } catch (error) {
                return client.logger.error(`Music - Error resuming the player: ${player.guildId}`, error);
            }
        }

        await node.updateSession(true);

        return client.logger.info(`Node ${node.id} is now connected.`);
    },
});

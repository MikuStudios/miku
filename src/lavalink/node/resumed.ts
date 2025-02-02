import { container } from "#miku/inversify";
import { CoreClient, MusicManager, Sessions } from "#miku/structures";
import { Cache, Lavalink } from "#miku/structures";
import type { PlayerDataJson } from "#miku/types";

export default new Lavalink({
    name: "resumed",
    type: "node",
    run: async (node, _, players) => {
        if (!Array.isArray(players)) return;

        const manager = container.get(MusicManager);
        const sessions = container.get(Sessions);

        for (const data of players) {
            const session = await sessions.get<PlayerDataJson>(data.guildId);
            if (!session) continue;

            if (!data.state.connected) {
                sessions.delete(data.guildId);
                container.get(Cache).delete(`queue:${data.guildId}`);
                return;
            }

            const player = manager.createPlayer({
                guildId: data.guildId,
                voiceChannelId: session.voiceChannelId,
                textChannelId: session.textChannelId,
                selfDeaf: session.options?.selfDeaf,
                selfMute: session.options?.selfMute,
                volume: manager.options.playerOptions?.volumeDecrementer
                    ? Math.round(data.volume / manager.options.playerOptions.volumeDecrementer)
                    : data.volume,
                node: node.id,
                applyVolumeAsFilter: session.options.applyVolumeAsFilter,
                instaUpdateFiltersFix: session.options.instaUpdateFiltersFix,
                vcRegion: session.options.vcRegion,
            });

            player.set("messageId", session.messageId);
            player.set("autoplayEnabled", session.autoplayEnabled);
            player.set("me", session.me);

            player.voice = data.voice;

            await player.connect();

            Object.assign(player.filterManager, { data: data.filters });

            if (data.track) player.queue.current = manager.utils.buildTrack(data.track, session.me);

            Object.assign(player, {
                lastPosition: data.state.position,
                lastPositionChange: Date.now(),
                paused: data.paused,
                playing: !data.paused && !!data.track,
                repeatMode: session.repeatMode,
            });

            player.ping.lavalink = data.state.ping;

            await player.queue.utils.sync(true, true);

            const client = container.get(CoreClient);
            const debugEnabled = (await client.getRC()).debug;

            return debugEnabled && client.logger.debug(`Player at ${data.guildId} has been resumed.`);
        }
    },
});

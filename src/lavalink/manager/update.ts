import type { ClientUser } from "seyfert";
import { container } from "#miku/inversify";
import { Sessions } from "#miku/structures";
import { CoreClient, Lavalink } from "#miku/structures";
import type { PlayerDataJson } from "#miku/types";

export default new Lavalink({
    name: "playerUpdate",
    type: "manager",
    run: async (oldPlayer, newPlayer) => {
        const newPlayerJson = newPlayer.toJSON();

        const sessions = container.get(Sessions);

        if (
            !oldPlayer ||
            oldPlayer.voiceChannelId !== newPlayerJson.voiceChannelId ||
            oldPlayer.textChannelId !== newPlayerJson.textChannelId ||
            oldPlayer.options.selfDeaf !== newPlayerJson.options.selfDeaf ||
            oldPlayer.options.selfMute !== newPlayerJson.options.selfDeaf ||
            oldPlayer.nodeId !== newPlayerJson.nodeId ||
            oldPlayer.nodeSessionId !== newPlayerJson.nodeSessionId ||
            oldPlayer.options.applyVolumeAsFilter !== newPlayerJson.options.applyVolumeAsFilter ||
            oldPlayer.options.instaUpdateFiltersFix !== newPlayerJson.options.instaUpdateFiltersFix ||
            oldPlayer.options.vcRegion !== newPlayerJson.options.vcRegion
        ) {
            if (newPlayerJson.queue?.current) newPlayerJson.queue.current.userData = {};

            const {
                ping: _p,
                createdTimeStamp: _cts,
                lavalinkVolume: _lv,
                equalizer: _eq,
                lastPositionChange: _lpc,
                paused: _pd,
                playing: _pg,
                ...newJson
            } = newPlayerJson;

            const client = container.get(CoreClient);

            await sessions.set<PlayerDataJson>(newPlayer.guildId, {
                ...newJson,
                messageId: newPlayer.get("messageId"),
                autoplayEnabled: newPlayer.get("autoplayEnabled"),
                me: newPlayer.get<ClientUser | undefined>("me"),
            });

            const debugEnabled = (await client.getRC()).debug;

            return debugEnabled && client.logger.debug(`Player at ${newPlayer.guildId} has been updated.`);
        }
    },
});

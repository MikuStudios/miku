import type { ChannelDeletePacket, VoicePacket, VoiceServer, VoiceState } from "lavalink-client";
import { createEvent } from "seyfert";
import { container } from "#miku/inversify";
import { MusicManager } from "#miku/structures";

type AnyPacket = VoicePacket | VoiceServer | VoiceState | ChannelDeletePacket;

export default createEvent({
    data: { name: "raw" },
    run: async (data) => await container.get(MusicManager).sendRawData(data as AnyPacket),
});

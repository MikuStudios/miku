import { ActionRow, Button, type User } from "seyfert";
import { ButtonStyle } from "seyfert/lib/types/index.js";
import { container } from "#miku/inversify";
import { CoreClient, Lavalink } from "#miku/structures";

export default new Lavalink({
    name: "trackStart",
    type: "manager",
    run: async (player, track) => {
        if (!(player.textChannelId && player.voiceChannelId)) return;
        if (!track) return;

        const client = container.get(CoreClient);
        const { colors, icons } = client.config;

        const formattedAuthor = track.info.author.includes(" - Topic") ? track.info.author.split(" - Topic")[0] : track.info.author;
        const requester = await client.members.fetch(player.guildId, (track.requester as User).id);

        const row = new ActionRow<Button>().setComponents([
            new Button().setCustomId("previous-track-button").setStyle(ButtonStyle.Secondary).setEmoji("<:previous:1324770096807284958>"),
            new Button().setCustomId("pause-track-button").setStyle(ButtonStyle.Secondary).setEmoji("<:pause:1324770761906458715>"),
            new Button().setCustomId("next-track-button").setStyle(ButtonStyle.Secondary).setEmoji("<:next:1324770898376392706>"),
            new Button().setCustomId("autoplay-button").setStyle(ButtonStyle.Secondary).setEmoji("<:auto:1324879157125189743>"),
        ]);

        const { client: _c1, ...message } = await client.messages.write(player.textChannelId, {
            components: [row],
            embeds: [
                {
                    color: colors.normal,
                    title: "Now playing",
                    description: `${icons.playing} [${track.info.title}](${track.info.uri}) by [${formattedAuthor}](${track.pluginInfo.artistUrl ?? track.info.uri})`,
                    footer: {
                        text: `Requested by ${requester.username}`,
                        icon_url: requester.avatarURL(),
                    },
                },
            ],
        });

        player.set("messageId", message.id);
    },
});

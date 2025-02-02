import { inject } from "inversify";
import { Command, Declare, type GuildCommandContext, Middlewares, Options, type TextBaseGuildChannel, createStringOption } from "seyfert";
import { MessageFlags } from "seyfert/lib/types/index.js";
import { container } from "#miku/inversify";
import { MusicManager } from "#miku/structures";
import { getMemberAndChannel } from "#miku/utils";

const options = {
    query: createStringOption({
        description: "A url or search query to play.",
        required: true,
        autocomplete: async (int) => {
            const query = int.options.getAutocompleteValue();
            if (!query)
                return int.respond([
                    { name: "No query provided", value: "https://open.spotify.com/track/3X1LErJuyzAEjH6X11ooMS?si=f31cc808cea34b06" },
                ]);

            const manager = container.get(MusicManager);
            const { loadType, playlist, tracks } = await manager.search(query, int.user);

            switch (loadType) {
                case "error":
                case "empty": {
                    return int.respond([{ name: "No results found", value: query }]);
                }
                case "search": {
                    return int.respond(
                        tracks
                            .map(({ info }) => ({
                                name: `${info.title.length > 50 ? `${info.title.slice(0, 50)}...` : info.title} (${info.author})`,
                                value: info.uri,
                            }))
                            .splice(0, 10),
                    );
                }   
                case "playlist": {
                    if (playlist) {
                        const playlistName = playlist.title.length > 50 ? `${playlist.title.slice(0, 50)}...` : playlist.title;
                        return int.respond([{ name: `Playlist: ${playlistName}`, value: playlist.uri ?? query }]);
                    }
                }
            }
        },
    }),
};

@Declare({
    name: "play",
    description: "Plays the provided song or search query",
})
@Options(options)
@Middlewares(["inVoiceChannel", "hasVoicePermissions", "inSameVoiceChannel"])
export default class PlayCommand extends Command {
    @inject(MusicManager) private readonly _manager!: MusicManager;

    /**
     * Executes the play command to play a song in a voice channel.
     *
     * @param ctx - The context of the guild command, containing options and author information.
     * @returns A promise that resolves when the command execution is complete.
     */
    override async run(ctx: GuildCommandContext<typeof options>) {
        const guild = await ctx.guild("flow");
        const options = ctx.options;

        const voiceChannel = await getMemberAndChannel(guild, ctx.author.id);
        const textChannel = (await ctx.channel()) as TextBaseGuildChannel;

        const { colors, icons } = ctx.client.config;

        await ctx.deferReply();

        const player = this._manager.createPlayer({
            guildId: guild.id,
            voiceChannelId: voiceChannel!.channel!.id,
            textChannelId: textChannel.id,
            selfDeaf: true,
            volume: 100,
        });

        if (!player.connected) {
            await player.connect();

            const me = await ctx.me();
            const botVoiceStatus = await me!.voice();
            if (voiceChannel!.channel!.isStage()) {
                setTimeout(async () => {
                    await botVoiceStatus.setSuppress(false).catch(() => {});
                }, 1000);
            }
        }

        const { client: _c1, ...clientUser } = ctx.client.me;
        const { client: _c2, ...trackRequester } = ctx.author;

        const { loadType, tracks, playlist } = await this._manager.search(options.query, { ...trackRequester });

        player.set("context", ctx);
        player.set("me", clientUser);

        switch (loadType) {
            case "empty":
            case "error": {
                if (!player.queue.current) await player.destroy();

                return ctx.editOrReply({
                    flags: MessageFlags.Ephemeral,
                    embeds: [
                        {
                            description: `No results found for ${options.query}`,
                            color: colors.error,
                        },
                    ],
                });
            }
            case "search":
            case "track": {
                await player.queue.add(tracks[0]);
                if (!player.queue.current) await player.play();

                const formattedAuthor = tracks[0].info.author.includes(" - Topic")
                    ? tracks[0].info.author.split(" - Topic")[0]
                    : tracks[0].info.author;

                return ctx.editOrReply({
                    embeds: [
                        {
                            description: `${icons.success} Queued *[${tracks[0].info.title}](${tracks[0].info.uri})* by *[${formattedAuthor}](${tracks[0].pluginInfo.artistUrl ?? tracks[0].info.uri})*`,
                            color: colors.success,
                        },
                    ],
                });
            }
            case "playlist": {
                player.queue.add(tracks);
                if (!player.queue.current) await player.play();

                return ctx.editOrReply({
                    embeds: [
                        {
                            description: `${icons.success} Added **${tracks.length}** tracks from *[${playlist?.title}](${playlist?.uri ?? options.query})* to the queue.`,
                            color: colors.success,
                        },
                    ],
                });
            }
        }
    }
}

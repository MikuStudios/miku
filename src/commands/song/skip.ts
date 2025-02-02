import { inject } from "inversify";
import { Command, Declare, type GuildCommandContext, Middlewares, Options, createIntegerOption } from "seyfert";
import { MessageFlags } from "seyfert/lib/types/index.js";
import { MusicManager } from "#miku/structures";

const options = {
    position: createIntegerOption({
        description: "The position of the song to skip to.",
        required: false,
    }),
};

@Declare({
    name: "skip",
    description: "Skip the current song or to a specific song in the queue.",
})
@Options(options)
@Middlewares(["inVoiceChannel", "inSameVoiceChannel", "queueExists", "isQueueEmpty"])
export default class SkipCommand extends Command {
    @inject(MusicManager) private readonly musicManager!: MusicManager;

    override async run(ctx: GuildCommandContext<typeof options>) {
        const options = ctx.options;
        const player = this.musicManager.getPlayer(ctx.guildId!)!;

        const { colors, icons } = ctx.client.config;

        if (options.position && !player.queue.tracks[options.position - 1]) {
            return ctx.editOrReply({
                flags: MessageFlags.Ephemeral,
                embeds: [
                    {
                        color: colors.error,
                        description: `${icons.error} The specified track does not exist in the queue.`,
                    },
                ],
            });
        }

        await ctx.deferReply();

        const trackToSkip = options.position ? player.queue.tracks[options.position - 1] : player.queue.current;
        const selection = options.position
            ? `to track *[${trackToSkip?.info.title}](<${trackToSkip?.info.uri}>)* at position \`#${options.position}\``
            : `*[${trackToSkip?.info.title}](<${trackToSkip?.info.uri}>)*.`;

        if (player.paused) await player.resume();

        await player.skip(options.position, false);

        return ctx.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    color: colors.success,
                    description: `${icons.success} Skipped ${selection}`,
                },
            ],
        });
    }
}

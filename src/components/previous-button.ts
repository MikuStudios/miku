import { ComponentCommand, type GuildComponentContext, Middlewares } from "seyfert";
import { MessageFlags } from "seyfert/lib/types/index.js";
import { container } from "#miku/inversify";
import { MusicManager } from "#miku/structures";

@Middlewares(["inVoiceChannel", "inSameVoiceChannel", "queueExists", "isQueueEmpty", "trackExists"])
export default class PreviousButton extends ComponentCommand {
    componentType = "Button" as const;

    filter(ctx: GuildComponentContext<typeof this.componentType>) {
        return ctx.customId === "previous-track-button";
    }

    public override async run(context: GuildComponentContext<typeof this.componentType>) {
        const manager = container.get(MusicManager);
        const player = manager.getPlayer(context.guildId!)!;

        const { colors, icons } = context.client.config;

        await context.deferUpdate();

        try {
            const previousTrack = await player.queue.shiftPrevious();
            player.queue.add(previousTrack, 0);
            return player.skip();
        } catch (error) {
            context.client.logger.error(`Error while trying to skip to the previous track: ${error}`);
            return context.editOrReply({
                flags: MessageFlags.Ephemeral,
                embeds: [
                    {
                        color: colors.error,
                        description: `${icons.error} An error occurred while trying to skip to the previous track.`,
                    },
                ],
            });
        }
    }
}

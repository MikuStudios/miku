import { createMiddleware } from "seyfert";
import { container } from "#miku/inversify";
import { MusicManager } from "#miku/structures";

/**
 * Middleware to check if a music player exists for the current guild.
 *
 * @param middle - The middleware context.
 * @returns A promise that resolves to the next middleware or stops the chain if no player is found.
 */
export const queueExists = createMiddleware<void>(async (middle) => {
    const context = middle.context;

    const manager = container.get(MusicManager);
    const player = manager.getPlayer(context.guildId!);
    if (!player)
        return middle.stop(
            "There is no player active in this server, please join a voice channel and use the play command to start playing music.",
        );

    return middle.next();
});

/**
 * Middleware to check if the music queue is empty.
 *
 * @param middle - The middleware context object.
 * @returns A promise that resolves to the next middleware in the chain or stops the chain with a message.
 */
export const isQueueEmpty = createMiddleware<void>(async (middle) => {
    const context = middle.context;

    const manager = container.get(MusicManager);
    const player = manager.getPlayer(context.guildId!)!;

    const autoplayStatus = player.get<boolean>("autoplayEnabled");
    const queueSize = player.queue.tracks.length + Number(!!player.queue.current);

    if ((!autoplayStatus && queueSize === 0) || (autoplayStatus && queueSize === 0))
        return middle.stop("The queue is empty, please add some songs to the queue first.");

    return middle.next();
});

/**
 * Middleware to check if the track exists in the queue.
 *
 * @param middle - The middleware context.
 * @returns The next middleware function if the track exists, otherwise stops the middleware chain.
 */
export const trackExists = createMiddleware<void>(async (middle) => {
    const context = middle.context;
    const interaction = context.interaction;

    const manager = container.get(MusicManager);
    const player = manager.getPlayer(context.guildId!)!;

    const messageId = player.get<string>("messageId") ?? "";
    if (interaction.message?.id !== messageId) return middle.stop("This track is no longer available or has been already skipped.");

    return middle.next();
});

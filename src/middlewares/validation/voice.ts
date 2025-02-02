import { createMiddleware } from "seyfert";

/**
 * Middleware to check if a member is in a voice channel.
 *
 * @param middle - The middleware context.
 * @returns A promise that resolves to the next middleware if the member is in a voice channel, or stops with an error message otherwise.
 */
export const inVoiceChannel = createMiddleware<void>(async (middle) => {
    const context = middle.context;

    const voiceState = await context.client.cache.voiceStates?.get(context.member?.id!, context.guildId!);
    if (!voiceState) return middle.stop("You must be in a voice channel first.");

    return middle.next();
});

/**
 * Middleware to check if the user is in the same voice channel as the bot.
 *
 * @param middle - The middleware context.
 * @returns A promise that resolves to either stopping the middleware chain with an error message
 */
export const inSameVoiceChannel = createMiddleware<void>(async (middle) => {
    const context = middle.context;

    const voiceState = await context.client.cache.voiceStates?.get(context.member?.id!, context.guildId!);
    const clientVoiceState = await context.client.cache.voiceStates?.get(context.client.botId!, context.guildId!);

    if (clientVoiceState && clientVoiceState.channelId !== voiceState!.channelId)
        return middle.stop(`You must be in the same voice channel <#${clientVoiceState.channelId}> to use this command.`);

    return middle.next();
});

/**
 * Middleware to check if the bot has the necessary voice permissions in a voice channel.
 *
 * @param middle - The middleware context.
 * @returns A promise that resolves to the next middleware or stops with an error message if permissions are missing.
 */
export const hasVoicePermissions = createMiddleware<void>(async (middle) => {
    const context = middle.context;
    const me = await context.me();

    const voiceChannel = await context.client.cache.voiceStates?.get(context.member?.id!, context.guildId!);
    const permissions = await context.client.channels.memberPermissions(voiceChannel!.channelId!, me!);
    const missingPermissions = permissions.keys(
        permissions.missings((await voiceChannel!.channel())?.isStage() ? ["MuteMembers"] : ["Connect", "Speak", "ViewChannel"]),
    );

    if (missingPermissions.length)
        return middle.stop(`I'm missing the following to play music in this channel: ${missingPermissions.join(", ")}`);

    return middle.next();
});

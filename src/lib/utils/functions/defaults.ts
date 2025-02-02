import { type AnyContext, AttachmentBuilder } from "seyfert";
import { MessageFlags } from "seyfert/lib/types/index.js";

/**
 * Handles errors that occur during the execution of middlewares.
 *
 * @param context - The command context in which the error occurred.
 * @param error - The error message to be displayed.
 * @returns A promise that resolves to the edited or replied message.
 */
export async function onMiddlewaresError(context: AnyContext, error: string) {
    const { colors, icons } = context.client.config;

    return context.editOrReply({
        flags: MessageFlags.Ephemeral,
        embeds: [{ description: `${icons.error} ${error}`, color: colors.error }],
    });
}

/**
 * Handles errors that occur during the execution of a command or component.
 *
 * @param context - The context in which the error occurred, containing information about the client, guild, and member.
 * @param error - The error that was thrown. This can be of any type.
 *
 * @returns A promise that resolves when the error details have been logged to the specified logs channel.
 */
export async function onRunError(context: AnyContext, error: unknown) {
    const { client } = context;
    const { LOGS_CHANNEL } = process.env;

    const guild = (await context.guild("flow")) ?? (await client.guilds.fetch(context.guildId!));
    const member = context.member ?? context.author;

    const errorDetails = [
        `Guild: ${guild.name} (${guild.id})`,
        `Executor: ${member.username} (${member.id})`,
        `Error: \n${error instanceof Error ? error.stack : String(error)}`,
    ];

    const filename = `${guild.id}-${new Date().toISOString()}.txt`;
    const fileBuffer = Buffer.from(errorDetails.join("\n"), "utf-8");
    const attachmentFile = new AttachmentBuilder({ filename }).setFile("buffer", fileBuffer);

    return client.messages.write(LOGS_CHANNEL, {
        files: [attachmentFile],
        embeds: [
            {
                title: "Error while running a command or component",
                description: "An error occurred while running a command or component.",
            },
        ],
    });
}

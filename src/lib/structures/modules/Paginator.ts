import { ActionRow, type AnyContext, Button, type Embed, type Message, type WebhookMessage } from "seyfert";
import type { InteractionCreateBodyRequest, InteractionMessageUpdateBodyRequest } from "seyfert/lib/common/index.js";
import { type APIButtonComponentWithCustomId, ButtonStyle, ComponentType, MessageFlags } from "seyfert/lib/types/index.js";

export class EmbedPaginator {
    private pages: Record<string, number> = {};
    private embeds: Embed[] = [];

    private ctx: AnyContext;
    private message: Message | WebhookMessage | null;

    constructor(ctx: AnyContext) {
        this.ctx = ctx;
        this.message = null;
    }

    /**
     * Generates an action row with pagination buttons (Previous, Next, and Page Position).
     * 
     * @param userId - The user ID to control button state (disabled/enabled).
     * @returns The generated action row with buttons.
     */
    private getRow(userId: string): ActionRow<Button> {
        const { pages, embeds } = this;

        const row = new ActionRow<Button>().addComponents(
            new Button()
                .setLabel("Previous")
                .setStyle(ButtonStyle.Secondary)
                .setCustomId("pagination-pagePrev")
                .setDisabled(pages[userId] === 0),
            new Button()
                .setLabel(`${this.currentPage}/${this.maxPages}`)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true)
                .setCustomId("pagination-pagePos"),
            new Button()
                .setLabel("Next")
                .setStyle(ButtonStyle.Secondary)
                .setCustomId("pagination-pageNext")
                .setDisabled(pages[userId] === embeds.length - 1),
        );

        return row;
    }

    /**
     * Creates a component collector to handle user interactions with pagination buttons.
     * The collector listens for 'Previous' and 'Next' button presses and updates the page accordingly.
     * Also disables buttons after a 60-second idle timeout.
     */
    private async createCollector(): Promise<void> {
        const { ctx, pages, embeds, message } = this;
        const { client } = ctx;

        if (!message) return;

        const userId = ctx.author.id;
        const collector = message.createComponentCollector({
            idle: 60000,
            filter: async (interaction) => {
                if (interaction.user.id !== ctx.author.id) {
                    await interaction.editOrReply({
                        flags: MessageFlags.Ephemeral,
                        embeds: [
                            {
                                description: `Only the user: ${ctx.author.toString()} can use this.`,
                                color: 0xe5383b,
                            },
                        ],
                    });

                    return false;
                }

                return true;
            },
            onStop: async (reason) => {
                if (reason === "idle") {
                    if (!message) return;

                    const row = new ActionRow<Button>().setComponents(
                        message.components[0].components
                            .map((builder) => builder.toJSON())
                            .filter((row) => row.type === ComponentType.Button)
                            .map((component) => {
                                return new Button(component as APIButtonComponentWithCustomId).setDisabled(true);
                            }),
                    );

                    await client.messages.edit(message.id, message.channelId, { components: [row] }).catch(() => null);
                }
            },
        });

        collector.run(["pagination-pagePrev", "pagination-pageNext"], async (interaction) => {
            if (!interaction.isButton()) return;

            if (interaction.customId === "pagination-pagePrev" && pages[userId] > 0) --pages[userId];
            if (interaction.customId === "pagination-pageNext" && pages[userId] < embeds.length - 1) ++pages[userId];

            await interaction.deferUpdate();
            await ctx.editOrReply({ embeds: [embeds[pages[userId]]], components: [this.getRow(userId)] }).catch(() => null);
        });
    }

    /**
     * Gets the current page number the user is on (1-based index).
     * 
     * @returns The current page number.
     */
    get currentPage(): number {
        return this.pages[this.ctx.author.id] + 1;
    }

    /**
     * Gets the total number of pages in the paginator.
     * 
     * @returns The total number of pages.
     */
    get maxPages(): number {
        return this.embeds.length;
    }

    /**
     * Adds an embed to the paginator's list of pages.
     * 
     * @param embed - The embed to add to the paginator.
     * @returns The current instance of the EmbedPaginator (for chaining).
     */
    public addEmbed(embed: Embed): this {
        this.embeds.push(embed);
        return this;
    }

    /**
     * Sets the paginator to the specified page (1-based index).
     * 
     * @param page - The page number to set (1-based index).
     * @returns The current instance of the EmbedPaginator (for chaining).
     * @throws Will throw an error if no embeds are available, or if the page number is out of bounds.
     */
    public setPage(page: number): this {
        const { message, embeds, pages, ctx } = this;

        if (!embeds.length) throw new Error("I can't send the pagination without embeds.");
        if (!message) throw new Error("I can't set the page to an unresponded pagination.");

        if (page > embeds.length) throw new Error(`The page "${page}" exceeds the limit of "${embeds.length}" pages.`);

        const userId = ctx.author.id;

        pages[userId] = page - 1;

        ctx.editOrReply({
            content: "",
            embeds: [embeds[pages[userId]]],
            components: [this.getRow(userId)],
        });

        return this;
    }

    /**
     * Sends the first embed of the paginator along with pagination controls. Optionally, the message can be ephemeral.
     * 
     * @param ephemeral - Whether to make the message ephemeral (only visible to the user). Default is `false`.
     * @returns The current instance of the EmbedPaginator (for chaining).
     */
    public async reply(ephemeral?: boolean): Promise<this> {
        const { ctx, pages, embeds } = this;

        const flags = ephemeral ? MessageFlags.Ephemeral : undefined;
        const userId = ctx.author.id;

        pages[userId] = pages[userId] ?? 0;

        this.message = await ctx.editOrReply(
            {
                content: "",
                embeds: [embeds[pages[userId]]],
                components: [this.getRow(userId)],
                flags,
            },
            true,
        );

        await this.createCollector();

        return this;
    }

    /**
     * Edits the existing paginator message with new content, embed, and components.
     * 
     * @param body - The new content to update the message with. Can be either an `InteractionCreateBodyRequest` or `InteractionMessageUpdateBodyRequest`.
     * @returns The current instance of the EmbedPaginator (for chaining).
     * @throws Will throw an error if the message has not been created yet.
     */
    public async edit(body: InteractionCreateBodyRequest | InteractionMessageUpdateBodyRequest): Promise<this> {
        const { message, ctx } = this;
        if (!message) throw new Error("I can't set the page to an unresponded pagination.");

        await ctx.editOrReply(body);

        return this;
    }
}

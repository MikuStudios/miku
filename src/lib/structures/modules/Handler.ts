import { BaseHandler } from "seyfert/lib/common/index.js";
import type { Lavalink } from "#miku/structures";

import { inject } from "inversify";
import { container } from "#miku/inversify";
import { MusicManager } from "#miku/structures";
import { CoreClient } from "#miku/structures";

export class Handler extends BaseHandler {
    constructor(@inject(CoreClient) private client: CoreClient) {
        super(client.logger);

        this.logger.info("Handler loaded.");
    }

    /**
     * Loads Lavalink event files and registers them with the music manager.
     * @returns A promise that resolves when all events are loaded.
     */
    public async load(): Promise<void> {
        const manager = container.get(MusicManager);
        const files = await this.loadFilesK<{ default: Lavalink }>(
            await this.getFiles(await this.client.getRC().then((x) => x.locations.lavalink)),
        );

        for (const file of files) {
            const path = file.path.split(process.cwd()).slice(1).join(process.cwd());
            const event: Lavalink = file.file.default;

            if (!event) {
                this.logger.warn(`${path} doesn't export by \`export default new Lavaink({ ... })\``);
                continue;
            }

            if (!event.name) {
                this.logger.warn(`${path} doesn't have a \`name\``);
                continue;
            }

            if (typeof event.run !== "function") {
                this.logger.warn(`${path} doesn't have a \`run\` function`);
                continue;
            }

            if (event.isNodeEvent()) manager.nodeManager.on(event.name, event.run.bind(event));
            else if (event.isManagerEvent()) manager.on(event.name, event.run.bind(event));
        }
    }
}

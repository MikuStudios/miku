process.loadEnvFile();
import "reflect-metadata";

import { Logger } from "seyfert";
import { container } from "#miku/inversify";
import { CoreClient, Handler, MusicManager } from "#miku/structures";

Logger.dirname = "logs";
Logger.saveOnFile = "all";

await container.get(CoreClient).initialize();
await container.get(Handler).load();
await container.get(MusicManager).initialize();

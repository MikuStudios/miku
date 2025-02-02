import { Container, decorate, injectable } from "inversify";
import { Client, Command, ComponentCommand, SubCommand } from "seyfert";
import { MusicManager, QueueStore, Sessions } from "#miku/structures";
import { Cache, CoreClient, Handler } from "#miku/structures";

const container = new Container({ skipBaseClassChecks: true });

decorate(injectable(), Client);
decorate(injectable(), Command);
decorate(injectable(), SubCommand);
decorate(injectable(), ComponentCommand);

container.bind(CoreClient).toSelf().inSingletonScope();
container.bind(Cache).toSelf().inSingletonScope();
container.bind(MusicManager).toSelf().inSingletonScope();
container.bind(QueueStore).toSelf().inSingletonScope();
container.bind(Sessions).toSelf().inSingletonScope();
container.bind(Handler).toSelf().inSingletonScope();

export { container };

import type { LavalinkManagerEvents, LavalinkNodeOptions, NodeManagerEvents, PlayerJson } from "lavalink-client";
import type { ClientUser } from "seyfert";
import type { Awaitable } from "seyfert/lib/common/index.js";
import type { Lavalink } from "#miku/structures";

export type AllEvents = LavalinkManagerEvents & NodeManagerEvents;
export type LavalinkEventRun<K extends keyof AllEvents> = (...args: Parameters<AllEvents[K]>) => Awaitable<any>;
export type LavalinkEventType<K extends keyof AllEvents> = K extends keyof NodeManagerEvents ? "node" : "manager";

export type LavalinkNode = Lavalink<keyof NodeManagerEvents>;
export type LavalinkManager = Lavalink<keyof LavalinkManagerEvents>;

export interface LavalinkEvent<K extends keyof AllEvents> {
    name: K;
    type: LavalinkEventType<K>;
    run: LavalinkEventRun<K>;
}

export type PlayerDataJson = Omit<
    PlayerJson,
    "ping" | "createdTimeStamp" | "lavalinkVolume" | "equalizer" | "lastPositionChange" | "paused" | "playing"
> & {
    messageId?: string;
    autoplayEnabled?: boolean;
    me?: ClientUser;
};

export type NonResumableOptions = Omit<LavalinkNodeOptions, "sessionId">;

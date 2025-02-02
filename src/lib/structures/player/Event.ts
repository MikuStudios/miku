import type { AllEvents, LavalinkEvent, LavalinkEventRun, LavalinkEventType, LavalinkManager, LavalinkNode } from "#miku/types";

/**
 * Represents a Lavalink event wrapper that standardizes event handling.
 * @template K - The key of the Lavalink event from AllEvents.
 */
export class Lavalink<K extends keyof AllEvents = keyof AllEvents> implements LavalinkEvent<K> {
    readonly name: K;
    readonly type: LavalinkEventType<K>;
    readonly run: LavalinkEventRun<K>;

    constructor(event: LavalinkEvent<K>) {
        this.name = event.name;
        this.type = event.type;
        this.run = event.run;
    }

    /**
     * Checks if the event is a Lavalink node event.
     * @returns True if the event type is "node", otherwise false.
     */
    public isNodeEvent(): this is LavalinkNode {
        return this.type === "node";
    }

    /**
     * Checks if the event is a Lavalink manager event.
     * @returns True if the event type is "manager", otherwise false.
     */
    public isManagerEvent(): this is LavalinkManager {
        return this.type === "manager";
    }
}

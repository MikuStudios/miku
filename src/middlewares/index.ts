import { isQueueEmpty, queueExists, trackExists } from "./validation/queue.js";
import { hasVoicePermissions, inSameVoiceChannel, inVoiceChannel } from "./validation/voice.js";

export const middlewares = {
    inVoiceChannel,
    inSameVoiceChannel,
    hasVoicePermissions,
    queueExists,
    isQueueEmpty,
    trackExists,
} as const;

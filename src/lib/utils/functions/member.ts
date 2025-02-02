import type { ClientUser, Guild, User } from "seyfert";
import type { APIUser } from "seyfert/lib/types/index.js";

export async function getMemberAndChannel(guild: Guild<"api" | "cached">, userId: string) {
    try {
        const member = await guild.members.fetch(userId);
        const voiceState = await member.voice();
        const channel = await voiceState.channel();

        return { member, channel };
    } catch (error) {
        return null;
    }
}

export function requesterTransformer(requester: unknown): APIUser {
    const requesterUser = requester as User | ClientUser;
    const user = omitKeys(requesterUser, ["client"]);

    return {
        ...user,
        global_name: requesterUser.username,
    };
}

export function omitKeys<T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    return Object.fromEntries(Object.entries(obj).filter(([key]) => !keys.includes(key as K))) as Omit<T, K>;
}

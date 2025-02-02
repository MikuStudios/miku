export * from "./lavalink.js";

export type Config = {
    colors: {
        error: number;
        success: number;
        normal: number;
    };
    icons: {
        error: string;
        success: string;
        playing: string;
    };
};

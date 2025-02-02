import type { Player, Track, UnresolvedTrack } from "lavalink-client";
import type { ClientUser } from "seyfert";

type ResolvableTrack = UnresolvedTrack | Track;

export async function autoPlayFunction(player: Player, lastPlayedTrack: Track) {
    if (!lastPlayedTrack) return;
    if (!player.get("autoplayEnabled")) return;

    if (!player.queue.previous.some((t) => t.info.identifier === lastPlayedTrack.info.identifier)) {
        player.queue.previous.unshift(lastPlayedTrack);
        await player.queue.utils.save();
    }

    const me = player.get<ClientUser>("me");

    switch (lastPlayedTrack.info.sourceName) {
        case "spotify":
            {
                const previousSpotifyTracks = player.queue.previous.filter(({ info }) => info.sourceName === "spotify").splice(0, 1);
                if (!previousSpotifyTracks.length) previousSpotifyTracks.push(lastPlayedTrack);

                const trackIds = previousSpotifyTracks.map(
                    ({ info }) => info.identifier ?? info.uri.split("/").reverse()?.[0] ?? info.uri.split("/").reverse()?.[1],
                );

                const search = await player.search({ query: `seed_tracks=${trackIds.join(",")}`, source: "sprec" }, me);

                if (search.tracks.length) {
                    const random = Math.floor(Math.random() * search.tracks.length);
                    const tracks = filterTracks(player, lastPlayedTrack, search.tracks).slice(random, random + 1) as Track[];
                    await player.queue.add(tracks);
                }
            }
            break;
        case "youtube":
        case "youtubemusic":
            {
                const url = `https://www.youtube.com/watch?v=${lastPlayedTrack.info.identifier}&list=RD${lastPlayedTrack.info.identifier}`;
                const search = await player.search({ query: url }, me);

                if (search.tracks.length) {
                    const random = Math.floor(Math.random() * search.tracks.length);
                    const tracks = filterTracks(player, lastPlayedTrack, search.tracks).slice(random, random + 1) as Track[];
                    await player.queue.add(tracks);
                }
            }
            break;
    }
}

function filterTracks(player: Player, lastPlayedTrack: Track, tracks: ResolvableTrack[]) {
    return tracks.filter(
        (track) =>
            !(
                player.queue.previous.some((t) => t.info.identifier === track.info.identifier) ||
                lastPlayedTrack.info.identifier === track.info.identifier
            ),
    );
}

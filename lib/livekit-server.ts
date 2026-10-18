import { timingSafeEqual } from "node:crypto";
import { RoomServiceClient, ServerError, TrackType } from "livekit-server-sdk";

export const ROOM_NAME = "translation";
export const BROADCASTER_IDENTITY = "translator";

export type LiveKitConfig = { url: string; apiKey: string; apiSecret: string };

export function livekitConfig(): LiveKitConfig | null {
  const { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env;
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) return null;
  return { url: LIVEKIT_URL, apiKey: LIVEKIT_API_KEY, apiSecret: LIVEKIT_API_SECRET };
}

export const notConfigured = () =>
  Response.json({ error: "Translation service is not configured." }, { status: 500 });

export function passcodeMatches(given: unknown): boolean {
  const expected = process.env.BROADCAST_PASSCODE;
  if (!expected || typeof given !== "string") return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function roomService(config: LiveKitConfig) {
  return new RoomServiceClient(config.url, config.apiKey, config.apiSecret);
}

/** Live means the translator is in the room with a microphone track published (muted counts as live). */
export async function isBroadcastLive(config: LiveKitConfig) {
  try {
    const translator = await roomService(config).getParticipant(ROOM_NAME, BROADCASTER_IDENTITY);
    return translator.tracks.some((t) => t.type === TrackType.AUDIO);
  } catch (e) {
    // 404 just means the room or the translator doesn't exist; anything else is worth seeing in the logs.
    if (!(e instanceof ServerError && e.status === 404)) console.error("LiveKit status check failed", e);
    return false;
  }
}

/** Deleting the room disconnects every listener at once. */
export async function endBroadcast(config: LiveKitConfig) {
  try {
    await roomService(config).deleteRoom(ROOM_NAME);
  } catch (e) {
    // 404 means the room is already gone; anything else left listeners connected.
    if (e instanceof ServerError && e.status === 404) return;
    console.error("LiveKit room delete failed", e);
    throw e;
  }
}

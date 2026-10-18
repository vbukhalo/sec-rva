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

function passcodeMatches(given: unknown): boolean {
  const expected = process.env.BROADCAST_PASSCODE;
  if (!expected || typeof given !== "string") return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Best effort: each serverless instance keeps its own counts, so this slows guessing rather than stopping it.
const MAX_FAILURES = 10;
const LOCKOUT_MS = 10 * 60_000;
const FAILURE_DELAY_MS = 1_000;
const failures = new Map<string, { count: number; since: number }>();

function clientIp(request: Request) {
  return (
    request.headers.get("x-nf-client-connection-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}

/** Returns an error response if the passcode is wrong or this IP has guessed wrong too often, otherwise null. */
export async function rejectPasscode(request: Request, given: unknown): Promise<Response | null> {
  const now = Date.now();
  for (const [ip, entry] of failures) if (now - entry.since > LOCKOUT_MS) failures.delete(ip);

  const ip = clientIp(request);
  const entry = failures.get(ip);
  if (entry && entry.count >= MAX_FAILURES) {
    return Response.json({ error: "Too many incorrect passcodes. Try again in 10 minutes." }, { status: 429 });
  }
  if (passcodeMatches(given)) {
    failures.delete(ip);
    return null;
  }
  failures.set(ip, { count: (entry?.count ?? 0) + 1, since: entry?.since ?? now });
  await new Promise((resolve) => setTimeout(resolve, FAILURE_DELAY_MS));
  return Response.json({ error: "Incorrect passcode." }, { status: 401 });
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

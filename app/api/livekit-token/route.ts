import { timingSafeEqual } from "node:crypto";
import { AccessToken, TrackSource } from "livekit-server-sdk";

const ROOM_NAME = "translation";
const BROADCASTER_IDENTITY = "translator";

function passcodeMatches(given: unknown): boolean {
  const expected = process.env.BROADCAST_PASSCODE;
  if (!expected || typeof given !== "string") return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env;
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    return Response.json({ error: "Translation service is not configured." }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const isBroadcaster = body.role === "broadcaster";

  if (isBroadcaster && !passcodeMatches(body.passcode)) {
    return Response.json({ error: "Incorrect passcode." }, { status: 401 });
  }

  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: isBroadcaster ? BROADCASTER_IDENTITY : `listener-${crypto.randomUUID()}`,
    ttl: "6h",
  });

  token.addGrant(
    isBroadcaster
      ? {
          room: ROOM_NAME,
          roomJoin: true,
          canPublish: true,
          canPublishSources: [TrackSource.MICROPHONE],
          canSubscribe: false,
          canPublishData: false,
        }
      : {
          room: ROOM_NAME,
          roomJoin: true,
          canPublish: false,
          canSubscribe: true,
          canPublishData: false,
        },
  );

  return Response.json({ url: LIVEKIT_URL, token: await token.toJwt() });
}

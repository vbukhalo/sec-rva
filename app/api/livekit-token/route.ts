import { AccessToken, TrackSource } from "livekit-server-sdk";
import {
  BROADCASTER_IDENTITY,
  ROOM_NAME,
  isBroadcastLive,
  livekitConfig,
  notConfigured,
  rejectPasscode,
} from "@/lib/livekit-server";

export async function POST(request: Request) {
  const config = livekitConfig();
  if (!config) return notConfigured();

  // A body of `null` parses fine, so fall back for it as well as for invalid JSON.
  const body = (await request.json().catch(() => null)) ?? {};
  const isBroadcaster = body.role === "broadcaster";

  if (isBroadcaster) {
    const rejected = await rejectPasscode(request, body.passcode);
    if (rejected) return rejected;
  }
  // Listeners only join while the translator is on air, so idle phones don't use up minutes.
  if (!isBroadcaster && !(await isBroadcastLive(config))) {
    return Response.json({ error: "The translation isn't live right now." }, { status: 409 });
  }

  const token = new AccessToken(config.apiKey, config.apiSecret, {
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

  return Response.json({ url: config.url, token: await token.toJwt() });
}

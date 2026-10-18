import { endBroadcast, livekitConfig, notConfigured, rejectPasscode } from "@/lib/livekit-server";

export async function POST(request: Request) {
  const config = livekitConfig();
  if (!config) return notConfigured();

  // A body of `null` parses fine, so fall back for it as well as for invalid JSON.
  const body = (await request.json().catch(() => null)) ?? {};
  const rejected = await rejectPasscode(request, body.passcode);
  if (rejected) return rejected;

  try {
    await endBroadcast(config);
  } catch {
    return Response.json({ error: "Could not end the broadcast." }, { status: 502 });
  }
  return Response.json({ ok: true });
}

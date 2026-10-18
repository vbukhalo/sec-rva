import { endBroadcast, livekitConfig, notConfigured, passcodeMatches } from "@/lib/livekit-server";

export async function POST(request: Request) {
  const config = livekitConfig();
  if (!config) return notConfigured();

  const body = await request.json().catch(() => ({}));
  if (!passcodeMatches(body.passcode)) {
    return Response.json({ error: "Incorrect passcode." }, { status: 401 });
  }

  try {
    await endBroadcast(config);
  } catch {
    return Response.json({ error: "Could not end the broadcast." }, { status: 502 });
  }
  return Response.json({ ok: true });
}

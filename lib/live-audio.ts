import { useEffect } from "react";

type TokenRequest = { role: "listener" } | { role: "broadcaster"; passcode: string };

/** The translator isn't broadcasting, so the server won't let listeners join. */
export class NotLiveError extends Error {}

export async function fetchToken(body: TokenRequest): Promise<{ url: string; token: string }> {
  const res = await fetch("/api/livekit-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 409) throw new NotLiveError(data.error);
  if (!res.ok) throw new Error(data.error ?? "Could not connect. Please try again.");
  return data;
}

/** Keeps the phone screen on while `active`, so the browser doesn't suspend audio when it locks. */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = async () => {
      try {
        const next = await navigator.wakeLock.request("screen");
        if (cancelled) next.release();
        else lock = next;
      } catch {
        // Not allowed (e.g. low battery mode); audio still plays, the screen may just lock.
      }
    };
    // The lock is dropped whenever the page is hidden, so take it again on return.
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") request();
    };

    request();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      lock?.release();
    };
  }, [active]);
}

"use client";

import { useEffect, useRef, useState } from "react";
import { DisconnectReason, Room, RoomEvent, Track, type RemoteParticipant } from "livekit-client";
import { Loader2, Play, Square } from "lucide-react";
import { fetchToken, NotLiveError, useWakeLock } from "@/lib/live-audio";

type Status = "idle" | "connecting" | "notLive" | "paused" | "live" | "reconnecting" | "ended" | "error";

const BROADCASTER_IDENTITY = "translator";
// While not live, check this often, and give up after an hour so a forgotten tab stops polling.
const POLL_INTERVAL_MS = 15_000;
const MAX_POLLS = 240;
// If the translator drops off without ending the broadcast, wait this long for them to come back.
const TRANSLATOR_GRACE_MS = 60_000;

const STATUS_TEXT: Record<Status, string> = {
  idle: "Tap to listen",
  connecting: "Connecting…",
  notLive: "The translation hasn't started yet. This page will connect automatically when it does.",
  paused: "Translator is paused",
  live: "Live",
  reconnecting: "Reconnecting…",
  ended: "The translation has ended.",
  error: "",
};

export default function Player() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [needsTap, setNeedsTap] = useState(false);
  const roomRef = useRef<Room | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioContainerRef = useRef<HTMLDivElement>(null);

  const active = status !== "idle" && status !== "ended" && status !== "error";
  // Includes waiting for the broadcast to start: a locked phone stops the polling timers.
  useWakeLock(active);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      roomRef.current?.disconnect();
    },
    [],
  );

  function clearTimer() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }

  function teardown() {
    clearTimer();
    const room = roomRef.current;
    roomRef.current = null;
    room?.disconnect();
    if (audioContainerRef.current) audioContainerRef.current.innerHTML = "";
    setNeedsTap(false);
  }

  function finish(next: Status, message: string | null = null) {
    teardown();
    setError(message);
    setStatus(next);
  }

  function start() {
    setError(null);
    setStatus("connecting");

    const room = new Room({ adaptiveStream: false, dynacast: false });
    roomRef.current = room;
    // Unlock audio playback while still inside the tap; iOS refuses to play otherwise.
    room.startAudio().catch(() => {});

    const isTranslator = (p: RemoteParticipant) => p.identity === BROADCASTER_IDENTITY;
    const waitForTranslator = () => {
      setStatus("paused");
      clearTimer();
      timerRef.current = setTimeout(() => finish("ended"), TRANSLATOR_GRACE_MS);
    };
    const refresh = () => {
      const translator = room.getParticipantByIdentity(BROADCASTER_IDENTITY);
      const publication = translator?.getTrackPublication(Track.Source.Microphone);
      setStatus(publication?.isSubscribed && !publication.isMuted ? "live" : "paused");
    };

    room
      .on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
        if (track.kind === Track.Kind.Audio) audioContainerRef.current?.appendChild(track.attach());
        // Only audio counts as the translator being back; rejoining without publishing still times out.
        if (isTranslator(participant)) clearTimer();
        refresh();
      })
      .on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach().forEach((el) => el.remove());
        refresh();
      })
      .on(RoomEvent.TrackMuted, refresh)
      .on(RoomEvent.TrackUnmuted, refresh)
      .on(RoomEvent.ParticipantDisconnected, (p) => {
        if (isTranslator(p)) waitForTranslator();
      })
      .on(RoomEvent.Reconnecting, () => setStatus("reconnecting"))
      .on(RoomEvent.Reconnected, refresh)
      .on(RoomEvent.AudioPlaybackStatusChanged, () => setNeedsTap(!room.canPlaybackAudio))
      .on(RoomEvent.Disconnected, (reason) => {
        if (roomRef.current !== room) return; // stopped on purpose
        if (!joined) return; // a failed join attempt; tryJoin handles it
        // The translator tapping "End broadcast" deletes the room.
        if (reason === DisconnectReason.ROOM_DELETED) finish("ended");
        else finish("error", "The connection was lost.");
      });

    let polls = 0;
    let joined = false;
    const tryJoin = async () => {
      timerRef.current = null;
      try {
        const { url, token } = await fetchToken({ role: "listener" });
        if (roomRef.current !== room) return;
        await room.connect(url, token);
        joined = true;
        setNeedsTap(!room.canPlaybackAudio);
        // The translator may have left, or stopped publishing, between the token check and joining.
        const translator = room.getParticipantByIdentity(BROADCASTER_IDENTITY);
        if (translator?.getTrackPublication(Track.Source.Microphone)) refresh();
        else waitForTranslator();
      } catch (e) {
        if (roomRef.current !== room) return;
        // Once waiting, a network blip or server hiccup shouldn't stop the page from joining later.
        const waiting = e instanceof NotLiveError || polls > 0;
        if (waiting && ++polls < MAX_POLLS) {
          setStatus("notLive");
          timerRef.current = setTimeout(tryJoin, POLL_INTERVAL_MS);
        } else if (waiting) {
          finish("error", "The translation hasn't started yet.");
        } else {
          finish("error", e instanceof Error ? e.message : "Could not connect.");
        }
      }
    };
    tryJoin();
  }

  function stop() {
    finish("idle");
  }

  useEffect(() => {
    if (!active || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: "Live Translation",
      artist: "Slavic Evangelical Church",
    });
    navigator.mediaSession.setActionHandler("pause", stop);
    navigator.mediaSession.setActionHandler("stop", stop);
    return () => {
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("stop", null);
    };
    // `stop` only touches refs and state setters, so it never goes stale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <button
        onClick={active ? stop : start}
        aria-label={active ? "Stop listening" : "Start listening"}
        className={`relative h-40 w-40 rounded-full flex items-center justify-center transition-all active:scale-95 ${
          active ? "bg-white/10 border-2 border-teal-400" : "bg-teal-600 hover:bg-teal-500 shadow-2xl shadow-teal-900/50"
        }`}
      >
        {status === "live" && <span className="absolute inset-0 rounded-full border-2 border-teal-400 animate-ping opacity-40" />}
        {status === "connecting" || status === "reconnecting" ? (
          <Loader2 size={56} className="animate-spin" />
        ) : active ? (
          <Square size={48} fill="currentColor" />
        ) : (
          <Play size={64} fill="currentColor" className="ml-2" />
        )}
      </button>

      <div className="min-h-12 flex flex-col items-center gap-2" aria-live="polite">
        {status === "live" ? (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-100 text-sm font-medium">
            <span className="h-2 w-2 rounded-full bg-red-500" /> Live
          </span>
        ) : (
          <p className="text-gray-300">{status === "error" ? error : STATUS_TEXT[status]}</p>
        )}
        {(status === "error" || status === "ended") && <p className="text-sm text-gray-500">Tap the button to check again.</p>}
        {active && <p className="text-xs text-gray-500">Tap again to stop</p>}
      </div>

      {needsTap && (
        <button
          onClick={() => roomRef.current?.startAudio().then(() => setNeedsTap(false))}
          className="px-6 py-3 bg-white text-gray-900 font-bold rounded-xl"
        >
          Tap to enable sound
        </button>
      )}

      <div ref={audioContainerRef} hidden />
    </div>
  );
}

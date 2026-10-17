"use client";

import { useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import { Loader2, Play, Square } from "lucide-react";
import { fetchToken, useWakeLock } from "@/lib/live-audio";

type Status = "idle" | "connecting" | "waiting" | "paused" | "live" | "reconnecting" | "error";

const STATUS_TEXT: Record<Status, string> = {
  idle: "Tap to listen",
  connecting: "Connecting…",
  waiting: "Waiting for the translator to start…",
  paused: "Translator is paused",
  live: "Live",
  reconnecting: "Reconnecting…",
  error: "",
};

export default function Player() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [needsTap, setNeedsTap] = useState(false);
  const roomRef = useRef<Room | null>(null);
  const audioContainerRef = useRef<HTMLDivElement>(null);

  const listening = status !== "idle" && status !== "error";
  useWakeLock(listening);

  useEffect(() => () => void roomRef.current?.disconnect(), []);

  async function start() {
    setError(null);
    setStatus("connecting");

    const room = new Room({ adaptiveStream: false, dynacast: false });
    roomRef.current = room;
    // Unlock audio playback while still inside the tap; iOS refuses to play otherwise.
    room.startAudio().catch(() => {});

    const refresh = () => {
      const publications = [...room.remoteParticipants.values()].flatMap((p) => [
        ...p.audioTrackPublications.values(),
      ]);
      if (publications.some((pub) => pub.isSubscribed && !pub.isMuted)) setStatus("live");
      else if (publications.length > 0) setStatus("paused");
      else setStatus("waiting");
    };

    room
      .on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) audioContainerRef.current?.appendChild(track.attach());
        refresh();
      })
      .on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach().forEach((el) => el.remove());
        refresh();
      })
      .on(RoomEvent.TrackMuted, refresh)
      .on(RoomEvent.TrackUnmuted, refresh)
      .on(RoomEvent.TrackUnpublished, refresh)
      .on(RoomEvent.ParticipantDisconnected, refresh)
      .on(RoomEvent.Reconnecting, () => setStatus("reconnecting"))
      .on(RoomEvent.Reconnected, refresh)
      .on(RoomEvent.AudioPlaybackStatusChanged, () => setNeedsTap(!room.canPlaybackAudio))
      .on(RoomEvent.Disconnected, () => {
        if (roomRef.current !== room) return; // stopped on purpose
        roomRef.current = null;
        setError("The connection was lost.");
        setStatus("error");
      });

    try {
      const { url, token } = await fetchToken({ role: "listener" });
      await room.connect(url, token);
      setNeedsTap(!room.canPlaybackAudio);
      refresh();
    } catch (e) {
      roomRef.current = null;
      room.disconnect();
      setError(e instanceof Error ? e.message : "Could not connect.");
      setStatus("error");
    }
  }

  function stop() {
    const room = roomRef.current;
    roomRef.current = null;
    room?.disconnect();
    if (audioContainerRef.current) audioContainerRef.current.innerHTML = "";
    setNeedsTap(false);
    setStatus("idle");
  }

  useEffect(() => {
    if (!listening || !("mediaSession" in navigator)) return;
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
  }, [listening]);

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <button
        onClick={listening ? stop : start}
        aria-label={listening ? "Stop listening" : "Start listening"}
        className={`relative h-40 w-40 rounded-full flex items-center justify-center transition-all active:scale-95 ${
          listening ? "bg-white/10 border-2 border-teal-400" : "bg-teal-600 hover:bg-teal-500 shadow-2xl shadow-teal-900/50"
        }`}
      >
        {status === "live" && <span className="absolute inset-0 rounded-full border-2 border-teal-400 animate-ping opacity-40" />}
        {status === "connecting" || status === "reconnecting" ? (
          <Loader2 size={56} className="animate-spin" />
        ) : listening ? (
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
        {status === "error" && <p className="text-sm text-gray-500">Tap the button to try again.</p>}
        {listening && <p className="text-xs text-gray-500">Tap again to stop</p>}
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

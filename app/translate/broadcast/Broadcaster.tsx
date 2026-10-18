"use client";

import { useEffect, useRef, useState } from "react";
import {
  AudioPresets,
  createLocalAudioTrack,
  Room,
  RoomEvent,
  Track,
  type AudioCaptureOptions,
  type LocalAudioTrack,
} from "livekit-client";
import { Loader2, Mic, MicOff, Radio, Users } from "lucide-react";
import { fetchToken, useWakeLock } from "@/lib/live-audio";

type Status = "off" | "connecting" | "live" | "reconnecting";

function captureOptions(deviceId: string, voiceCleanup: boolean): AudioCaptureOptions {
  return {
    deviceId: deviceId || undefined,
    echoCancellation: voiceCleanup,
    noiseSuppression: voiceCleanup,
    autoGainControl: voiceCleanup,
    channelCount: 1,
  };
}

// Chrome adds "default"/"communications" aliases that duplicate a real mic in the list.
async function listMics() {
  const devices = await Room.getLocalDevices("audioinput");
  return devices.filter((d) => d.deviceId !== "default" && d.deviceId !== "communications");
}

export default function Broadcaster() {
  const [passcode, setPasscode] = useState("");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [voiceCleanup, setVoiceCleanup] = useState(true);
  const [track, setTrack] = useState<LocalAudioTrack | null>(null);
  // restartTrack swaps the underlying track, so the meter follows this rather than `track`.
  const [micStream, setMicStream] = useState<MediaStreamTrack | null>(null);
  const [status, setStatus] = useState<Status>("off");
  const [muted, setMuted] = useState(false);
  const [listeners, setListeners] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const roomRef = useRef<Room | null>(null);

  const onAir = status !== "off";
  useWakeLock(track !== null);

  // Release the mic and leave the room when the page goes away.
  useEffect(() => () => void roomRef.current?.disconnect(), []);
  useEffect(() => () => track?.stop(), [track]);

  // Pick up mics plugged in after the first test.
  useEffect(() => {
    if (!track) return;
    const refresh = () => listMics().then(setDevices).catch(() => {});
    navigator.mediaDevices.addEventListener("devicechange", refresh);
    return () => navigator.mediaDevices.removeEventListener("devicechange", refresh);
  }, [track]);

  // Closing the tab mid-service would cut every listener off, so ask first.
  useEffect(() => {
    if (!onAir) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [onAir]);

  async function openMic() {
    setError(null);
    try {
      const next = await createLocalAudioTrack(captureOptions(deviceId, voiceCleanup));
      setTrack(next);
      setMicStream(next.mediaStreamTrack);
      setDevices(await listMics());
    } catch {
      setError("Could not access the microphone. Allow microphone access in your browser settings.");
    }
  }

  async function changeMic(nextDeviceId: string, nextVoiceCleanup: boolean) {
    setDeviceId(nextDeviceId);
    setVoiceCleanup(nextVoiceCleanup);
    try {
      if (!track) return;
      await track.restartTrack(captureOptions(nextDeviceId, nextVoiceCleanup));
      setMicStream(track.mediaStreamTrack);
    } catch {
      setError("Could not switch microphones.");
    }
  }

  async function goLive() {
    if (!track) return;
    setError(null);
    setStatus("connecting");
    // An unexpected disconnect would otherwise stop the mic, and "Go live" again would publish a dead track.
    const room = new Room({ stopLocalTrackOnUnpublish: false });
    roomRef.current = room;
    // stopLive clears roomRef, so End broadcast during connecting cancels this attempt.
    const cancelled = () => roomRef.current !== room;
    const updateListeners = () => setListeners(room.remoteParticipants.size);
    room
      .on(RoomEvent.ParticipantConnected, updateListeners)
      .on(RoomEvent.ParticipantDisconnected, updateListeners)
      .on(RoomEvent.Reconnecting, () => setStatus("reconnecting"))
      .on(RoomEvent.Reconnected, () => setStatus("live"))
      .on(RoomEvent.Disconnected, () => {
        if (cancelled()) return; // stopped on purpose
        roomRef.current = null;
        setStatus("off");
        setError("The broadcast was disconnected. Check your internet connection and go live again.");
      });

    try {
      const { url, token } = await fetchToken({ role: "broadcaster", passcode });
      if (cancelled()) return;
      await room.connect(url, token);
      if (cancelled()) return void room.disconnect(false);
      await room.localParticipant.publishTrack(track, {
        source: Track.Source.Microphone,
        audioPreset: AudioPresets.speech,
        dtx: true,
        red: true,
      });
      if (cancelled()) return void room.disconnect(false);
      if (muted) await track.mute();
      updateListeners();
      setStatus("live");
    } catch (e) {
      if (cancelled()) return;
      roomRef.current = null;
      room.disconnect(false); // keep the mic open for another try
      setStatus("off");
      setError(e instanceof Error ? e.message : "Could not go live.");
    }
  }

  async function stopLive() {
    const room = roomRef.current;
    roomRef.current = null;
    // Closing the room on the server disconnects every listener right away.
    const ended = await fetch("/api/broadcast/end", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    })
      .then((res) => res.ok)
      .catch(() => false);
    // Leave anyway so the mic stops going out; listeners then time out on their own.
    room?.disconnect(false);
    setListeners(0);
    setStatus("off");
    if (!ended) setError("The broadcast stopped, but listeners may stay connected for up to a minute before it ends for them.");
  }

  async function toggleMute() {
    if (!track) return;
    if (muted) await track.unmute();
    else await track.mute();
    setMuted(!muted);
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="rounded-xl bg-red-500/15 border border-red-400/30 text-red-200 px-4 py-3 text-sm">{error}</p>}

      <section className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-4">
        <h2 className="font-bold text-lg">1. Microphone</h2>
        {!track ? (
          <button onClick={openMic} className="px-6 py-3 bg-white text-gray-900 font-bold rounded-xl inline-flex items-center justify-center gap-2">
            <Mic size={20} /> Test microphone
          </button>
        ) : (
          <>
            {micStream && <LevelMeter mediaStreamTrack={micStream} muted={muted} />}
            {devices.length > 1 && (
              <label className="flex flex-col gap-1 text-sm text-gray-400">
                Input
                <select
                  value={deviceId}
                  onChange={(e) => changeMic(e.target.value, voiceCleanup)}
                  className="bg-gray-800 border border-white/10 rounded-xl px-3 py-3 text-white"
                >
                  <option value="">Default microphone</option>
                  {devices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || "Microphone"}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={voiceCleanup}
                onChange={(e) => changeMic(deviceId, e.target.checked)}
                className="mt-1 h-4 w-4 accent-teal-500"
              />
              <span>
                Voice cleanup
                <span className="block text-gray-500">Keep on for a phone or headset mic. Turn off for a mixer or studio mic.</span>
              </span>
            </label>
          </>
        )}
      </section>

      <section className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-4">
        <h2 className="font-bold text-lg">2. Broadcast</h2>
        {!onAir && (
          <label className="flex flex-col gap-1 text-sm text-gray-400">
            Passcode
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="bg-gray-800 border border-white/10 rounded-xl px-3 py-3 text-white"
              autoComplete="current-password"
            />
          </label>
        )}

        {status === "off" ? (
          <button
            onClick={goLive}
            disabled={!track || !passcode}
            className="px-6 py-4 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:hover:bg-teal-600 font-bold rounded-xl inline-flex items-center justify-center gap-2"
          >
            <Radio size={20} /> Go live
          </button>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 font-bold">
                {status === "live" ? (
                  <>
                    <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" /> {muted ? "Live (muted)" : "Live"}
                  </>
                ) : (
                  <>
                    <Loader2 size={16} className="animate-spin" /> {status === "connecting" ? "Connecting…" : "Reconnecting…"}
                  </>
                )}
              </span>
              <span className="inline-flex items-center gap-2 text-gray-300">
                <Users size={18} /> {listeners} {listeners === 1 ? "listener" : "listeners"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={toggleMute}
                className={`px-4 py-4 font-bold rounded-xl inline-flex items-center justify-center gap-2 ${
                  muted ? "bg-amber-500 text-gray-900" : "bg-white/10 hover:bg-white/20"
                }`}
              >
                {muted ? <MicOff size={20} /> : <Mic size={20} />} {muted ? "Unmute" : "Mute"}
              </button>
              <button onClick={stopLive} className="px-4 py-4 bg-red-600 hover:bg-red-500 font-bold rounded-xl">
                End broadcast
              </button>
            </div>
            <p className="text-xs text-gray-500">Keep this page open and the screen on until the service ends.</p>
          </>
        )}
      </section>
    </div>
  );
}

// Room noise sits below the floor so the bar stays empty in silence; normal speech lands mid-bar.
const METER_FLOOR_DB = -48;
const METER_CEILING_DB = -12;

function LevelMeter({ mediaStreamTrack, muted }: { mediaStreamTrack: MediaStreamTrack; muted: boolean }) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const context = new AudioContext();
    context.resume().catch(() => {});
    const source = context.createMediaStreamSource(new MediaStream([mediaStreamTrack]));
    const analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    const samples = new Float32Array(analyser.fftSize);
    let level = 0;

    let frame = requestAnimationFrame(function tick() {
      analyser.getFloatTimeDomainData(samples);
      let sum = 0;
      for (const sample of samples) sum += sample * sample;
      const db = 20 * Math.log10(Math.sqrt(sum / samples.length) || 1e-6);
      const target = Math.min(1, Math.max(0, (db - METER_FLOOR_DB) / (METER_CEILING_DB - METER_FLOOR_DB)));
      // Rise quickly and fall slowly, like a sound-board meter, so it doesn't flicker between syllables.
      level = target > level ? level + (target - level) * 0.4 : Math.max(target, level - 0.012);
      if (barRef.current) barRef.current.style.width = `${level * 100}%`;
      frame = requestAnimationFrame(tick);
    });

    return () => {
      cancelAnimationFrame(frame);
      source.disconnect();
      context.close().catch(() => {});
    };
  }, [mediaStreamTrack]);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-gray-400">{muted ? "Muted" : "Speak to check your level"}</span>
      <div className="h-3 rounded-full bg-gray-800 overflow-hidden">
        <div ref={barRef} className={`h-full ${muted ? "bg-gray-600" : "bg-teal-400"}`} />
      </div>
    </div>
  );
}

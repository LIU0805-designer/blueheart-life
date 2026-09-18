"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from "react";

/* ──── 和弦进行 ──── */

interface ChordDef {
  name: string;
  notes: number[];
}

const PROGRESSION: ChordDef[] = [
  { name: "Am7", notes: [220.0, 261.63, 329.63, 440.0] },
  { name: "Fmaj7", notes: [174.61, 220.0, 261.63, 329.63] },
  { name: "Cmaj7", notes: [130.81, 164.81, 196.0, 246.94] },
  { name: "Gadd9", notes: [196.0, 246.94, 293.66, 440.0] },
];

const VARIATIONS: ChordDef[] = [
  { name: "Dm7", notes: [146.83, 174.61, 220.0, 261.63] },
  { name: "Em7", notes: [164.81, 196.0, 246.94, 293.66] },
];

/* ──── 工具函数 ──── */

function createReverb(ctx: AudioContext): ConvolverNode {
  const reverb = ctx.createConvolver();
  const sr = ctx.sampleRate;
  const len = sr * 2.5;
  const impulse = ctx.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = impulse.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sr * 0.85));
    }
  }
  return reverb;
}

function playChord(ctx: AudioContext, dest: AudioNode, chord: ChordDef) {
  const now = ctx.currentTime;
  const arpGap = 0.14;

  chord.notes.forEach((freq, i) => {
    const t = now + i * arpGap;

    const harmonics = [
      { ratio: 1, vol: 0.05 },
      { ratio: 2, vol: 0.02 },
      { ratio: 3, vol: 0.007 },
    ];

    harmonics.forEach(({ ratio, vol }) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq * ratio;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 4.5 + Math.random());
      osc.connect(g);
      g.connect(dest);
      osc.start(t);
      osc.stop(t + 5.5);
    });

    if (i <= 1) {
      const sub = ctx.createOscillator();
      const sg = ctx.createGain();
      sub.type = "sine";
      sub.frequency.value = freq * 0.5;
      sg.gain.setValueAtTime(0, t);
      sg.gain.linearRampToValueAtTime(0.025, t + 0.04);
      sg.gain.exponentialRampToValueAtTime(0.0001, t + 5);
      sub.connect(sg);
      sg.connect(dest);
      sub.start(t);
      sub.stop(t + 6);
    }
  });

  if (Math.random() > 0.35) {
    const hi = chord.notes[chord.notes.length - 1] * 2;
    const t = now + chord.notes.length * arpGap + Math.random() * 0.4;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = hi;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.015, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);
    osc.connect(g);
    g.connect(dest);
    osc.start(t);
    osc.stop(t + 3);
  }
}

function scheduleNext(
  ctx: AudioContext,
  dest: AudioNode,
  ids: ReturnType<typeof setTimeout>[],
  index: number,
  cycle: number
) {
  const delay = 8000 + Math.random() * 6000;
  const id = setTimeout(() => {
    const useVariation = cycle > 1 && Math.random() < 0.3;
    const chord = useVariation
      ? VARIATIONS[Math.floor(Math.random() * VARIATIONS.length)]
      : PROGRESSION[index % PROGRESSION.length];

    playChord(ctx, dest, chord);
    scheduleNext(ctx, dest, ids, useVariation ? index : index + 1, useVariation ? cycle : cycle);
  }, delay);
  ids.push(id);
}

/* ──── Context ──── */

interface AmbientContextValue {
  playing: boolean;
  toggle: () => void;
}

const AmbientSoundContext = createContext<AmbientContextValue | null>(null);

export function useAmbientSound() {
  const ctx = useContext(AmbientSoundContext);
  if (!ctx) throw new Error("useAmbientSound must be used within AmbientSoundProvider");
  return ctx;
}

/* ──── Provider ──── */

interface AudioState {
  ctx: AudioContext;
  masterGain: GainNode;
  timeoutIds: ReturnType<typeof setTimeout>[];
}

export function AmbientSoundProvider({ children }: { children: ReactNode }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<AudioState | null>(null);

  const start = useCallback(() => {
    if (audioRef.current) {
      const { ctx, masterGain } = audioRef.current;
      if (ctx.state === "suspended") ctx.resume();
      masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.13, ctx.currentTime + 2);
      playChord(ctx, masterGain, PROGRESSION[0]);
      scheduleNext(ctx, masterGain, audioRef.current.timeoutIds, 1, 0);
      setPlaying(true);
      return;
    }

    const ctx = new AudioContext();
    const masterGain = ctx.createGain();
    const reverb = createReverb(ctx);
    const dryGain = ctx.createGain();
    const wetGain = ctx.createGain();

    dryGain.gain.value = 0.55;
    wetGain.gain.value = 0.65;

    masterGain.connect(dryGain).connect(ctx.destination);
    masterGain.connect(wetGain).connect(reverb).connect(ctx.destination);

    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.13, ctx.currentTime + 2.5);

    const timeoutIds: ReturnType<typeof setTimeout>[] = [];

    playChord(ctx, masterGain, PROGRESSION[0]);
    setTimeout(() => playChord(ctx, masterGain, PROGRESSION[1]), 3500);
    scheduleNext(ctx, masterGain, timeoutIds, 2, 0);

    audioRef.current = { ctx, masterGain, timeoutIds };
    setPlaying(true);
  }, []);

  const stop = useCallback(() => {
    if (!audioRef.current) return;
    const { masterGain, ctx, timeoutIds } = audioRef.current;
    timeoutIds.forEach(clearTimeout);
    timeoutIds.length = 0;
    masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
    setPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (playing) stop();
    else start();
  }, [playing, start, stop]);

  return (
    <AmbientSoundContext.Provider value={{ playing, toggle }}>
      {children}
    </AmbientSoundContext.Provider>
  );
}

/**
 * Tiny Web Audio engine for the /showcase product demo.
 * Synthesises everything at runtime (no asset downloads): a subtle evolving pad
 * plus UI cues for the cold open, chapter transitions and tab expansion.
 * Autoplay-safe — nothing sounds until start() is called from a user gesture.
 */

type Cue = "intro" | "impact" | "transition" | "tabOpen" | "tabSwitch" | "tap" | "outro";

const NOTES: Record<string, number[]> = {
  Am: [110, 164.81, 220, 261.63],
  F: [87.31, 174.61, 220, 261.63],
  C: [98, 196, 261.63, 329.63],
  G: [98, 146.83, 196, 246.94],
};
const CHORDS = ["Am", "F", "C", "G", "Am", "F", "C", "G"];

export class ShowcaseAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private padGain: GainNode | null = null;
  private verb: ConvolverNode | null = null;
  private padVoices: { osc: OscillatorNode; gain: GainNode }[] = [];
  private running = false;

  get active() {
    return this.running;
  }

  async start() {
    if (this.running) return;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctor();
    await ctx.resume();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);
    master.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 1.2);
    this.master = master;

    // cheap noise-burst reverb
    const verb = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * 2.2);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    verb.buffer = buf;
    const verbGain = ctx.createGain();
    verbGain.gain.value = 0.3;
    verb.connect(verbGain).connect(master);
    this.verb = verb;

    const padGain = ctx.createGain();
    padGain.gain.value = 0;
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = "lowpass";
    padFilter.frequency.value = 1400;
    padGain.connect(padFilter);
    padFilter.connect(master);
    padFilter.connect(verb);
    this.padGain = padGain;

    // four detuned pad voices, retuned per chapter
    NOTES.Am.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? "sine" : "triangle";
      osc.frequency.value = f;
      osc.detune.value = (i - 1.5) * 6;
      const g = ctx.createGain();
      g.gain.value = i === 0 ? 0.3 : 0.16;
      osc.connect(g).connect(padGain);
      osc.start();
      this.padVoices.push({ osc, gain: g });
    });
    padGain.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 3);

    this.running = true;
  }

  stop() {
    if (!this.ctx || !this.master) return;
    const { ctx, master } = { ctx: this.ctx, master: this.master };
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    const closing = ctx;
    window.setTimeout(() => void closing.close(), 700);
    this.padVoices = [];
    this.ctx = null;
    this.master = null;
    this.padGain = null;
    this.running = false;
  }

  /** Retune the pad to the chapter's chord. */
  setChord(index: number) {
    if (!this.ctx) return;
    const chord = NOTES[CHORDS[index % CHORDS.length]];
    this.padVoices.forEach((v, i) => {
      v.osc.frequency.setTargetAtTime(chord[i] ?? chord[0], this.ctx!.currentTime, 0.35);
    });
  }

  cue(name: Cue) {
    if (!this.ctx || !this.master) return;
    switch (name) {
      case "intro":
        this.riser(3.2);
        this.shimmer(0.35, 0.06);
        break;
      case "impact":
        this.boom(0.55);
        this.whoosh(0.55, 0.16);
        break;
      case "transition":
        this.whoosh(0.7, 0.11);
        this.shimmer(0.9, 0.035);
        break;
      case "tabOpen":
        this.click(1500, 0.09);
        this.sweep(420, 1500, 0.32, 0.07);
        break;
      case "tabSwitch":
        this.click(1900, 0.07);
        this.blip(880, 0.05);
        break;
      case "tap":
        this.click(1250, 0.055);
        break;
      case "outro":
        this.boom(0.6);
        this.shimmer(2.4, 0.07);
        break;
    }
  }

  // ── primitives ─────────────────────────────────────────────
  private noiseSource(dur: number) {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    return src;
  }

  private whoosh(dur: number, amp: number) {
    const ctx = this.ctx!;
    const src = this.noiseSource(dur);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.1;
    bp.frequency.setValueAtTime(400, ctx.currentTime);
    bp.frequency.exponentialRampToValueAtTime(6000, ctx.currentTime + dur * 0.7);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(amp, ctx.currentTime + dur * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    src.connect(bp).connect(g).connect(this.master!);
    g.connect(this.verb!);
    src.start();
    src.stop(ctx.currentTime + dur);
  }

  private riser(dur: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + dur);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(500, ctx.currentTime);
    lp.frequency.exponentialRampToValueAtTime(7000, ctx.currentTime + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.13, ctx.currentTime + dur * 0.92);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur + 0.15);
    osc.connect(lp).connect(g).connect(this.master!);
    g.connect(this.verb!);
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.2);
  }

  private boom(amp: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(38, ctx.currentTime + 0.75);
    const g = ctx.createGain();
    g.gain.setValueAtTime(amp, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.6);
    osc.connect(g).connect(this.master!);
    g.connect(this.verb!);
    osc.start();
    osc.stop(ctx.currentTime + 1.7);
    this.whoosh(0.5, amp * 0.2);
  }

  private click(freq: number, amp: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.55, ctx.currentTime + 0.09);
    const g = ctx.createGain();
    g.gain.setValueAtTime(amp, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    osc.connect(g).connect(this.master!);
    g.connect(this.verb!);
    osc.start();
    osc.stop(ctx.currentTime + 0.14);
  }

  private blip(freq: number, amp: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 0.14);
    const g = ctx.createGain();
    g.gain.setValueAtTime(amp, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
    osc.connect(g).connect(this.master!);
    g.connect(this.verb!);
    osc.start();
    osc.stop(ctx.currentTime + 0.24);
  }

  private sweep(from: number, to: number, dur: number, amp: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(from, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(to, ctx.currentTime + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(amp, ctx.currentTime + dur * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur + 0.1);
    osc.connect(g).connect(this.master!);
    g.connect(this.verb!);
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.12);
  }

  private shimmer(dur: number, amp: number) {
    const ctx = this.ctx!;
    [1318.5, 1760, 2093, 2637].forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.05);
      g.gain.exponentialRampToValueAtTime(amp, ctx.currentTime + 0.1 + i * 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur + i * 0.05);
      osc.connect(g).connect(this.verb!);
      g.connect(this.master!);
      osc.start();
      osc.stop(ctx.currentTime + dur + 0.3);
    });
  }
}

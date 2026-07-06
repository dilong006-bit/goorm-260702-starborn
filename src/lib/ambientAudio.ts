/**
 * 생성형 앰비언트 사운드스케이프 — Epic A3.
 *
 * 왜 Web Audio 생성형인가(§8 리스크):
 *  - 라이선스 부담 0(샘플·음원 없음), 무한 재생, 경량(에셋 로드 0).
 *  - 레이어드 패드(디튠 오실레이터) + 필터드 노이즈 + 합성 리버브(ConvolverNode).
 *
 * autoplay 정책(§7): AudioContext는 반드시 사용자 제스처 이후 start()로 생성/재개.
 * 백그라운드 전환 시 자동 페이드아웃(visibilitychange).
 *
 * 싱글턴 — 앱 전체에서 하나의 사운드스케이프만 울린다(미디어 충돌 방지).
 */

type Listener = (playing: boolean) => void;

// C 마이너 계열의 낮고 포근한 화음(Hz) — 우주적 정적감
const PAD_FREQS = [110.0, 164.81, 220.0, 329.63]; // A2, E3, A3, E4

class AmbientAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private nodes: AudioScheduledSourceNode[] = [];
  private lfos: OscillatorNode[] = [];
  private playing = false;
  private targetVolume = 0.5;
  private listeners = new Set<Listener>();
  private boundVisibility?: () => void;

  isPlaying(): boolean {
    return this.playing;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    for (const fn of this.listeners) fn(this.playing);
  }

  /** 지수 감쇠 노이즈로 리버브 임펄스 생성(외부 IR 파일 불필요). */
  private makeReverbIR(ctx: AudioContext, seconds = 3.2, decay = 2.6): AudioBuffer {
    const rate = ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const ir = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return ir;
  }

  /** 핑크빛 노이즈 버퍼(우주 '쉬-' 음) — Paul Kellett 근사. */
  private makeNoiseBuffer(ctx: AudioContext, seconds = 4): AudioBuffer {
    const rate = ctx.sampleRate;
    const len = rate * seconds;
    const buf = ctx.createBuffer(1, len, rate);
    const out = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buf;
  }

  /** 사용자 제스처 이후 호출 — 사운드스케이프 시작(부드러운 페이드 인). */
  async start(volume = this.targetVolume): Promise<void> {
    this.targetVolume = volume;
    if (this.playing && this.ctx) {
      this.setVolume(volume);
      return;
    }
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return; // 미지원 브라우저 — 무해 no-op

    const ctx = new Ctor();
    if (ctx.state === "suspended") await ctx.resume();
    this.ctx = ctx;
    const now = ctx.currentTime;

    // master (fade in)
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), now + 2.4);
    master.connect(ctx.destination);
    this.master = master;

    // reverb (wet) + dry 믹스
    const convolver = ctx.createConvolver();
    convolver.buffer = this.makeReverbIR(ctx);
    const wet = ctx.createGain();
    wet.gain.value = 0.5;
    convolver.connect(wet).connect(master);

    // 공용 로우패스(느린 LFO로 컷오프 흔들기 → 살아있는 질감)
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 700;
    lp.Q.value = 0.7;
    lp.connect(master);
    lp.connect(convolver);

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.06; // ~16초 주기
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 260;
    lfo.connect(lfoGain).connect(lp.frequency);
    lfo.start();
    this.lfos.push(lfo);

    // 패드 — 디튠된 오실레이터 화음
    PAD_FREQS.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i % 2 === 0 ? "sine" : "triangle";
      osc.frequency.value = f;
      osc.detune.value = (i - 1.5) * 4; // 미세 디튠으로 코러스감

      const g = ctx.createGain();
      g.gain.value = 0.16 / PAD_FREQS.length + i * 0.008;

      // 개별 진폭 LFO(아주 느리게 숨쉬기)
      const ampLfo = ctx.createOscillator();
      ampLfo.frequency.value = 0.03 + i * 0.011;
      const ampLfoGain = ctx.createGain();
      ampLfoGain.gain.value = g.gain.value * 0.5;
      ampLfo.connect(ampLfoGain).connect(g.gain);
      ampLfo.start();
      this.lfos.push(ampLfo);

      osc.connect(g).connect(lp);
      osc.start();
      this.nodes.push(osc);
    });

    // 필터드 핑크 노이즈(우주 배경음)
    const noise = ctx.createBufferSource();
    noise.buffer = this.makeNoiseBuffer(ctx);
    noise.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 480;
    noiseFilter.Q.value = 0.5;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.5;
    noise.connect(noiseFilter).connect(noiseGain).connect(lp);
    noise.start();
    this.nodes.push(noise);

    this.playing = true;
    this.emit();

    // 백그라운드 전환 시 자동 페이드(다른 미디어 존중)
    this.boundVisibility = () => {
      if (document.hidden) this.stop();
    };
    document.addEventListener("visibilitychange", this.boundVisibility);
  }

  setVolume(v: number): void {
    this.targetVolume = v;
    if (this.ctx && this.master) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(Math.max(0.0002, v), now, 0.2);
    }
  }

  /** 부드러운 페이드아웃 후 컨텍스트 정리. */
  stop(): void {
    if (!this.ctx || !this.master) {
      this.playing = false;
      this.emit();
      return;
    }
    const ctx = this.ctx;
    const master = this.master;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    const nodes = this.nodes;
    const lfos = this.lfos;
    window.setTimeout(() => {
      try {
        nodes.forEach((n) => n.stop());
        lfos.forEach((n) => n.stop());
        void ctx.close();
      } catch {
        /* 이미 정리됨 */
      }
    }, 1400);

    if (this.boundVisibility) {
      document.removeEventListener("visibilitychange", this.boundVisibility);
      this.boundVisibility = undefined;
    }
    this.ctx = null;
    this.master = null;
    this.nodes = [];
    this.lfos = [];
    this.playing = false;
    this.emit();
  }
}

/** 앱 전역 단일 사운드스케이프. */
export const ambient = new AmbientAudio();

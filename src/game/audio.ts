import type { SoundEvent } from "./engine";

/** 音效在用户手势后创建，不加载外部资源；暂停时关闭持续行驶声。 */
export class GameAudio {
  private context?: AudioContext;
  private master?: GainNode;
  private motor?: OscillatorNode;
  private motorGain?: GainNode;
  muted = false;

  unlock() {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0.18;
      this.master.connect(this.context.destination);
      this.motor = this.context.createOscillator();
      this.motor.type = "sawtooth";
      const filter = this.context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 180;
      this.motorGain = this.context.createGain();
      this.motorGain.gain.value = 0;
      this.motor.connect(filter);
      filter.connect(this.motorGain);
      this.motorGain.connect(this.master);
      this.motor.start();
    }
    void this.context.resume().catch(() => undefined);
  }

  setMuted(value: boolean) {
    this.muted = value;
    if (this.master && this.context)
      this.master.gain.setTargetAtTime(
        value ? 0 : 0.18,
        this.context.currentTime,
        0.03,
      );
  }

  drive(speed: number, active: boolean) {
    if (!this.context || !this.motor || !this.motorGain) return;
    this.motor.frequency.setTargetAtTime(
      35 + speed * 0.16,
      this.context.currentTime,
      0.1,
    );
    this.motorGain.gain.setTargetAtTime(
      active ? 0.09 : 0,
      this.context.currentTime,
      0.08,
    );
  }

  play(event: SoundEvent) {
    if (!this.context || !this.master || this.muted) return;
    const notes: Record<SoundEvent, number[]> = {
      start: [392, 523, 784],
      change: [330, 440],
      brake: [170, 100],
      warning: [660],
      leading: [440, 554, 659, 880],
      pass: [880],
      crash: [110, 73, 45],
      victory: [523, 659, 784, 1046],
    };
    notes[event].forEach((freq, i) => {
      const ctx = this.context!,
        oscillator = ctx.createOscillator(),
        gain = ctx.createGain();
      const at = ctx.currentTime + i * 0.085;
      oscillator.type =
        event === "crash" || event === "brake" ? "sawtooth" : "sine";
      oscillator.frequency.setValueAtTime(freq, at);
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(
        event === "pass" ? 0.06 : 0.32,
        at + 0.012,
      );
      gain.gain.exponentialRampToValueAtTime(0.001, at + 0.23);
      oscillator.connect(gain);
      gain.connect(this.master!);
      oscillator.start(at);
      oscillator.stop(at + 0.25);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    });
  }

  dispose() {
    void this.context?.close().catch(() => undefined);
  }
}

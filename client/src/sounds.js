// Small, synthesized cues keep the game fast and avoid audio downloads.
let audioContext;

function context() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  audioContext ??= new AudioContextClass();
  if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
  return audioContext;
}

function tone(ctx, frequency, start, duration, volume = 0.035, type = "sine") {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.01);
}

function softTap(ctx, frequency, start, volume = 0.012) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.65, start + 0.075);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.08);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + 0.09);
}

function paperSwish(ctx, start) {
  const duration = 0.18;
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(850, start);
  filter.frequency.exponentialRampToValueAtTime(1400, start + duration);
  filter.Q.value = 0.7;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.014, start + 0.045);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start(start);
  source.stop(start + duration);
}

export function playSound(effect, enabled = true) {
  if (!enabled) return;
  try {
    const ctx = context();
    if (!ctx) return;
    const now = ctx.currentTime + 0.01;
    switch (effect) {
      case "key": tone(ctx, 520, now, 0.055, 0.016, "triangle"); break;
      case "delete": tone(ctx, 330, now, 0.065, 0.018, "triangle"); break;
      case "submit": tone(ctx, 440, now, 0.08, 0.025, "triangle"); break;
      case "invalid":
        tone(ctx, 230, now, 0.12, 0.035, "triangle");
        tone(ctx, 190, now + 0.13, 0.14, 0.035, "triangle");
        break;
      case "win":
        [523, 659, 784, 1047].forEach((frequency, i) => tone(ctx, frequency, now + i * 0.13, 0.25, 0.04));
        break;
      case "loss":
        [392, 330, 262].forEach((frequency, i) => tone(ctx, frequency, now + i * 0.17, 0.23, 0.035));
        break;
      case "result-row": softTap(ctx, 400, now); break;
      case "result-card": paperSwish(ctx, now); break;
      case "result-score":
        tone(ctx, 523, now, 0.16, 0.014, "triangle");
        tone(ctx, 659, now + 0.09, 0.23, 0.016, "triangle");
        break;
      case "result-medal":
        [784, 1047, 1319].forEach((frequency, i) => tone(ctx, frequency, now + i * 0.08, 0.3, 0.014));
        break;
      default: break;
    }
  } catch {
    // Audio is optional; unsupported or blocked devices should still play normally.
  }
}

export function playReveal(result, enabled = true) {
  if (!enabled) return;
  try {
    const ctx = context();
    if (!ctx) return;
    const now = ctx.currentTime + 0.26; // tile color appears halfway through each flip
    const frequencies = { correct: 660, present: 520, absent: 300 };
    result.forEach(({ status }, index) => {
      tone(ctx, frequencies[status] || 300, now + index * 0.1, 0.09, 0.025, "triangle");
    });
  } catch {
    // Sound effects must never interrupt a guess.
  }
}

// Som de novo pedido via Web Audio (o navegador exige um clique do usuário para liberar o áudio).
let ctx: AudioContext | null = null;

export async function enableSound(): Promise<boolean> {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") await ctx.resume();
    playNewOrderSound();
    return true;
  } catch {
    return false;
  }
}

export function playNewOrderSound() {
  if (!ctx) return;
  const t0 = ctx.currentTime;
  [880, 1320].forEach((freq, i) => {
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = t0 + i * 0.16;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
    osc.connect(gain).connect(ctx!.destination);
    osc.start(start);
    osc.stop(start + 0.32);
  });
}

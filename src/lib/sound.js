export function makeSound() {
  let ac, g, hp;
  return {
    start() {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ac = new AC();
      const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = buf.getChannelData(0); let last = 0;
      for (let i = 0; i < d.length; i++) { last = (last + .04 * (Math.random() * 2 - 1)) / 1.04; d[i] = last * 3.5; }
      const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
      hp = ac.createBiquadFilter(); hp.type = "highpass"; g = ac.createGain(); g.gain.value = 0;
      src.connect(hp); hp.connect(g); g.connect(ac.destination); src.start();
    },
    set(l) { if (!g) return; g.gain.setTargetAtTime(.08 + .5 * l, ac.currentTime, .3); hp.frequency.value = 700 - 500 * l; },
    stop() { try { ac && ac.close(); } catch (e) {} ac = g = hp = null; },
  };
}

// Estado partilhado, navegação e feedback (estrelas, sons, confetes).
(function () {
  'use strict';

  const $ = (sel, el) => (el || document).querySelector(sel);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const ELOGIOS = ['Muito bem! 🎉', 'Fantástico! 🌟', 'Boa! 👏', 'És uma craque! 🏆', 'Parabéns! 🥳', 'Excelente! 🚀', 'Isso mesmo! ✨'];
  const INCENTIVOS = ['Quase! Tenta outra vez. 💪', 'Ups! Olha com atenção. 🔍', 'Não desistas, tu consegues! 🌈'];

  // Estrelas e níveis vivem só em memória: ao abrir/recarregar a página, recomeça tudo.
  let estrelas = 0;
  let semSom = false;
  let audio = null;

  function renderEstrelas() { $('#estrelas').textContent = estrelas; }
  function renderSom() { $('#btn-som').textContent = semSom ? '🔇' : '🔊'; }

  function tocar(freqs) {
    if (semSom) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      let t = audio.currentTime;
      freqs.forEach((f) => {
        const osc = audio.createOscillator(), gain = audio.createGain();
        osc.type = 'triangle';
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(gain).connect(audio.destination);
        osc.start(t);
        osc.stop(t + 0.2);
        t += 0.12;
      });
    } catch (e) { /* sem áudio */ }
  }

  function confetes() {
    const cores = ['#ff6b6b', '#ffd93d', '#6bcB77', '#4d96ff', '#c77dff', '#ff9f1c'];
    for (let i = 0; i < 44; i++) {
      const c = document.createElement('i');
      c.className = 'confete';
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = pick(cores);
      c.style.animationDelay = Math.random() * 0.4 + 's';
      c.style.setProperty('--dx', (Math.random() * 200 - 100) + 'px');
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 2200);
    }
  }

  const VISTAS = ['menu', 'relogio', 'calendario'];
  function mostrar(vista) {
    VISTAS.forEach((v) => { $('#vista-' + v).hidden = v !== vista; });
    $('#btn-inicio').hidden = vista === 'menu';
    document.dispatchEvent(new CustomEvent('vista', { detail: vista }));
  }

  const App = {
    $, pick, mostrar,
    acerto(mensagemExtra) {
      estrelas++;
      renderEstrelas();
      confetes();
      tocar([523, 659, 784]);
      return pick(ELOGIOS) + (mensagemExtra ? ' ' + mensagemExtra : '');
    },
    erro() {
      tocar([300, 220]);
      return pick(INCENTIVOS);
    },
  };
  window.App = App;

  document.querySelectorAll('[data-vista]').forEach((b) =>
    b.addEventListener('click', () => mostrar(b.dataset.vista)));
  $('#btn-inicio').addEventListener('click', () => mostrar('menu'));
  $('#btn-som').addEventListener('click', () => {
    semSom = !semSom;
    renderSom();
  });

  renderEstrelas();
  renderSom();
})();

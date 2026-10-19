// Modo relógio: "Que horas são?" (lê os ponteiros) e "Põe as horas!" (arrasta os ponteiros).
(function () {
  'use strict';

  const { $ } = App;
  const NS = 'http://www.w3.org/2000/svg';
  const MAX_NIVEL = 5;
  const ACERTOS_PARA_SUBIR = 5;
  const PASSO_MINUTOS = { 1: 5, 2: 5, 3: 5, 4: 5, 5: 1 };

  const svg = $('#relogio-svg');
  const el = {
    pergunta: $('#relogio-pergunta'), alvo: $('#relogio-alvo'), extenso: $('#relogio-extenso'),
    form: $('#relogio-form'), input: $('#relogio-input'), feedback: $('#relogio-feedback'),
    nivel: $('#relogio-nivel'), check24: $('#relogio-24'), label24: $('#relogio-label-24'),
    seguinte: $('#relogio-seguinte'), verificar: $('#relogio-verificar'),
  };

  let modo = 'ler';
  let nivel = 1;
  let seguidos = 0;
  let alvo = { h: 3, m: 0 };
  let pm = false;
  let mao = { h: 12, m: 0 }; // hora mostrada no mostrador
  let tentativas = 0;
  let resolvido = false;
  let arrastar = null; // 'h' | 'm' | null

  // ---------- desenho do mostrador ----------
  function criar(nome, attrs, pai) {
    const e = document.createElementNS(NS, nome);
    Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v));
    (pai || svg).appendChild(e);
    return e;
  }

  function polar(raio, graus) {
    const r = (graus * Math.PI) / 180;
    return [raio * Math.sin(r), -raio * Math.cos(r)];
  }

  criar('circle', { r: 122, class: 'rel-borda' });
  criar('circle', { r: 108, class: 'rel-face' });
  for (let i = 0; i < 60; i++) {
    const grande = i % 5 === 0;
    const [x1, y1] = polar(grande ? 94 : 99, i * 6);
    const [x2, y2] = polar(104, i * 6);
    criar('line', { x1, y1, x2, y2, class: grande ? 'rel-marca-grande' : 'rel-marca' });
  }
  for (let n = 1; n <= 12; n++) {
    const [x, y] = polar(76, n * 30);
    const t = criar('text', { x, y, class: 'rel-num', 'text-anchor': 'middle', 'dominant-baseline': 'central' });
    t.textContent = n;
  }

  const gHoras = criar('g', { class: 'mao mao-horas' });
  criar('line', { x1: 0, y1: 10, x2: 0, y2: -50, class: 'mao-linha' }, gHoras);
  criar('circle', { cx: 0, cy: -50, r: 11, class: 'mao-pega', 'data-mao': 'h' }, gHoras);
  const gMinutos = criar('g', { class: 'mao mao-minutos' });
  criar('line', { x1: 0, y1: 12, x2: 0, y2: -84, class: 'mao-linha' }, gMinutos);
  criar('circle', { cx: 0, cy: -84, r: 11, class: 'mao-pega', 'data-mao': 'm' }, gMinutos);
  criar('circle', { r: 6, class: 'rel-centro' });

  function desenharMaos() {
    gHoras.setAttribute('transform', `rotate(${(mao.h % 12) * 30 + mao.m * 0.5})`);
    gMinutos.setAttribute('transform', `rotate(${mao.m * 6})`);
  }

  // ---------- perguntas ----------
  function usa24() { return el.check24.checked && nivel >= 3; }

  function limparFeedback() {
    el.feedback.textContent = '';
    el.feedback.className = 'feedback';
    gHoras.classList.remove('destaque');
    gMinutos.classList.remove('destaque');
  }

  // manter=true: repete a mesma hora (ex.: ao mudar de modo) se ainda não foi acertada.
  function novaPergunta(manter) {
    limparFeedback();
    if (!(manter && !resolvido)) {
      alvo = Logic.randomTime(nivel);
      pm = Math.random() < 0.5;
    }
    tentativas = 0;
    resolvido = false;
    el.seguinte.classList.remove('pulsar');
    el.seguinte.disabled = true;
    el.verificar.disabled = false;
    verificarMaos.disabled = false;
    el.input.disabled = false;
    el.input.value = '';

    const modo24 = usa24();
    const periodo = pm ? '🌙 da tarde/noite' : '☀️ da manhã';

    svg.classList.toggle('arrastavel', modo === 'por');
    el.form.hidden = modo !== 'ler';
    el.alvo.hidden = modo !== 'por';
    el.extenso.hidden = modo !== 'por';

    if (modo === 'ler') {
      mao = { h: alvo.h, m: alvo.m };
      el.pergunta.textContent = modo24
        ? `Que horas são? É ${periodo}. Escreve a hora com 24 horas!`
        : 'Que horas são? Escreve a hora no quadradinho!';
      el.input.focus();
    } else {
      mao = { h: 12, m: 0 };
      const h24 = modo24 ? (alvo.h % 12) + (pm ? 12 : 0) : alvo.h;
      el.pergunta.textContent = modo24
        ? `Arrasta os ponteiros para a hora certa! (${periodo})`
        : 'Arrasta os ponteiros para a hora certa!';
      el.alvo.textContent = Logic.formatTime(h24, alvo.m);
      el.extenso.textContent = Logic.timeWords(alvo.h, alvo.m) + '.';
    }
    desenharMaos();
  }

  function dicaTexto() {
    const m5 = alvo.m / 5;
    const minTxt = Number.isInteger(m5)
      ? `O ponteiro grande (dos minutos) aponta para o ${m5 === 0 ? '12' : m5}. Cada número vale 5 minutos!`
      : `O ponteiro grande está entre o ${Math.floor(m5) || 12} e o ${Math.ceil(m5)}. Cada número vale 5 minutos!`;
    return `O ponteiro pequeno (das horas) está no ${alvo.h}${alvo.m ? ' ou logo a seguir' : ''}. ${minTxt}`;
  }

  function resultado(certo) {
    if (certo) {
      resolvido = true;
      seguidos++;
      let extra = '';
      if (seguidos >= ACERTOS_PARA_SUBIR && nivel < MAX_NIVEL) {
        nivel++;
        seguidos = 0;
        el.nivel.value = nivel;
        extra = `Subiste para o nível ${nivel}! 🎈`;
      }
      el.feedback.textContent = App.acerto(extra);
      el.feedback.className = 'feedback certo';
      el.seguinte.classList.add('pulsar');
      el.seguinte.disabled = false;
      el.verificar.disabled = true;
      verificarMaos.disabled = true;
      el.input.disabled = true;
    } else {
      seguidos = 0;
      tentativas++;
      el.feedback.textContent = App.erro() + (tentativas >= 2 ? ' ' + dicaTexto() : '');
      el.feedback.className = 'feedback errado';
    }
  }

  // ---------- interação ----------
  el.form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (resolvido) return;
    const lido = Logic.parseTime(el.input.value);
    if (!lido) {
      el.feedback.textContent = 'Escreve a hora assim: 03:30 🙂';
      el.feedback.className = 'feedback errado';
      return;
    }
    resultado(Logic.checkTime(lido, alvo, usa24(), pm));
  });

  // No modo "Põe as horas!" não há caixa de texto: o botão verifica a posição dos ponteiros.
  const verificarMaos = document.createElement('button');
  verificarMaos.className = 'btn btn-verde';
  verificarMaos.textContent = 'Verificar ✔';
  verificarMaos.hidden = true;
  el.form.after(verificarMaos);
  verificarMaos.addEventListener('click', () => {
    if (resolvido) return;
    resultado(mao.h % 12 === alvo.h % 12 && mao.m === alvo.m);
  });

  $('#relogio-dica').addEventListener('click', () => {
    if (resolvido) return;
    gHoras.classList.add('destaque');
    gMinutos.classList.add('destaque');
    el.feedback.textContent = '💡 ' + dicaTexto();
    el.feedback.className = 'feedback dica';
  });
  el.seguinte.addEventListener('click', () => novaPergunta());

  // Mudar de nível só vale a partir da próxima pergunta (não permite saltar a atual).
  el.nivel.addEventListener('change', () => {
    nivel = +el.nivel.value;
    seguidos = 0;
    atualizarOpcoes();
  });
  el.check24.addEventListener('change', () => novaPergunta(true));

  document.querySelectorAll('.separador').forEach((b) =>
    b.addEventListener('click', () => {
      modo = b.dataset.modo;
      document.querySelectorAll('.separador').forEach((x) => x.classList.toggle('ativo', x === b));
      verificarMaos.hidden = modo !== 'por';
      novaPergunta(true);
    }));

  function atualizarOpcoes() {
    el.check24.disabled = nivel < 3;
    el.label24.classList.toggle('desativado', nivel < 3);
    if (nivel < 3) el.check24.checked = false;
  }

  // ---------- arrastar ponteiros ----------
  function anguloDoPonteiro(ev) {
    const p = svg.createSVGPoint();
    p.x = ev.clientX;
    p.y = ev.clientY;
    const q = p.matrixTransform(svg.getScreenCTM().inverse());
    return { graus: (Math.atan2(q.x, -q.y) * 180 / Math.PI + 360) % 360, dist: Math.hypot(q.x, q.y) };
  }

  const difAngulo = (a, b) => Math.abs(((a - b + 540) % 360) - 180);

  function escolherMao(ev, a) {
    const alvoEv = ev.target.getAttribute && ev.target.getAttribute('data-mao');
    if (alvoEv) return alvoEv;
    const dh = difAngulo(a.graus, (mao.h % 12) * 30 + mao.m * 0.5);
    const dm = difAngulo(a.graus, mao.m * 6);
    if (a.dist > 55) return 'm';
    return dh <= dm ? 'h' : 'm';
  }

  function mover(a) {
    if (arrastar === 'm') {
      const passo = PASSO_MINUTOS[nivel];
      const novo = (Math.round(a.graus / 6 / passo) * passo) % 60;
      if (mao.m > 45 && novo < 15) mao.h = (mao.h % 12) + 1;
      else if (mao.m < 15 && novo > 45) mao.h = ((mao.h + 10) % 12) + 1;
      mao.m = novo;
    } else {
      const h = Math.round((a.graus - mao.m * 0.5) / 30) % 12;
      mao.h = h === 0 ? 12 : h;
    }
    desenharMaos();
  }

  svg.addEventListener('pointerdown', (ev) => {
    if (modo !== 'por' || resolvido) return;
    const a = anguloDoPonteiro(ev);
    arrastar = escolherMao(ev, a);
    svg.setPointerCapture(ev.pointerId);
    limparFeedback();
    mover(a);
    ev.preventDefault();
  });
  svg.addEventListener('pointermove', (ev) => { if (arrastar) mover(anguloDoPonteiro(ev)); });
  const largar = () => { arrastar = null; };
  svg.addEventListener('pointerup', largar);
  svg.addEventListener('pointercancel', largar);

  // ---------- arranque ----------
  el.nivel.value = nivel;
  atualizarOpcoes();
  novaPergunta();
})();

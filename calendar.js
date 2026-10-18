// Modo calendário: um ano inteiro, com perguntas para clicar no dia certo.
(function () {
  'use strict';

  const { $, store, mostrar } = App;
  const ano = new Date().getFullYear();
  const ACERTOS_PARA_SUBIR = 4;
  const DIAS_CURTOS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];

  const el = {
    pergunta: $('#cal-pergunta'), feedback: $('#cal-feedback'), meses: $('#cal-meses'),
    nivel: $('#cal-nivel'), seguinte: $('#cal-seguinte'),
  };

  let nivel = store.get('nivelCalendario', 1);
  let seguidos = 0;
  let questao = null;
  let tentativas = 0;
  let resolvida = false;

  // ---------- desenho do ano ----------
  $('#cal-ano').textContent = `📆 ${ano}`;
  for (let m = 0; m < 12; m++) {
    const mes = document.createElement('div');
    mes.className = 'mes';
    mes.dataset.mes = m;
    const nome = Logic.MESES[m];
    mes.innerHTML = `<h3>${nome[0].toUpperCase() + nome.slice(1)}</h3>`;
    const grelha = document.createElement('div');
    grelha.className = 'grelha-mes';
    DIAS_CURTOS.forEach((d, i) => {
      const c = document.createElement('span');
      c.className = 'cab-dia' + (i >= 5 ? ' fds' : '');
      c.textContent = d;
      grelha.appendChild(c);
    });
    const vazios = (new Date(ano, m, 1).getDay() + 6) % 7; // semana começa à segunda
    for (let i = 0; i < vazios; i++) grelha.appendChild(document.createElement('span'));
    for (let d = 1; d <= Logic.daysIn(ano, m); d++) {
      const b = document.createElement('button');
      const dow = (new Date(ano, m, d).getDay() + 6) % 7;
      b.className = 'dia' + (dow >= 5 ? ' fds' : '');
      b.textContent = d;
      b.dataset.m = m;
      b.dataset.d = d;
      b.setAttribute('aria-label', `${d} de ${nome}`);
      grelha.appendChild(b);
    }
    mes.appendChild(grelha);
    el.meses.appendChild(mes);
  }

  const botaoDia = (data) => el.meses.querySelector(`.dia[data-m="${data.getMonth()}"][data-d="${data.getDate()}"]`);
  const cartaoMes = (m) => el.meses.querySelector(`.mes[data-mes="${m}"]`);

  function limpar() {
    el.meses.querySelectorAll('.errado, .certo, .dica-dia').forEach((e) => e.classList.remove('errado', 'certo', 'dica-dia'));
    el.meses.querySelectorAll('.mes.dica-mes').forEach((e) => e.classList.remove('dica-mes'));
    el.feedback.textContent = '';
    el.feedback.className = 'feedback';
  }

  // ---------- perguntas ----------
  function novaPergunta() {
    limpar();
    questao = Logic.generateQuestion(ano, nivel);
    tentativas = 0;
    resolvida = false;
    el.pergunta.textContent = questao.text;
    el.seguinte.classList.remove('pulsar');
  }

  function dar(msg, classe) {
    el.feedback.textContent = msg;
    el.feedback.className = 'feedback ' + classe;
  }

  function mostrarMes() {
    const c = cartaoMes(questao.date.getMonth());
    c.classList.add('dica-mes');
    c.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  el.meses.addEventListener('click', (ev) => {
    const b = ev.target.closest('.dia');
    if (!b || resolvida) return;
    const certo = +b.dataset.m === questao.date.getMonth() && +b.dataset.d === questao.date.getDate();
    if (certo) {
      resolvida = true;
      seguidos++;
      let extra = '';
      if (seguidos >= ACERTOS_PARA_SUBIR && nivel < Logic.NIVEIS_CALENDARIO) {
        nivel++;
        seguidos = 0;
        store.set('nivelCalendario', nivel);
        el.nivel.value = nivel;
        extra = `Subiste para o nível ${nivel}! 🎈`;
      }
      el.meses.querySelectorAll('.dica-mes').forEach((e) => e.classList.remove('dica-mes'));
      b.classList.add('certo');
      dar(App.acerto(extra), 'certo');
      el.seguinte.classList.add('pulsar');
      return;
    }
    seguidos = 0;
    tentativas++;
    b.classList.add('errado');
    if (tentativas === 2) {
      mostrarMes();
      dar(App.erro() + ' Procura neste mês! 👀', 'errado');
    } else if (tentativas >= 3) {
      resolvida = true;
      botaoDia(questao.date).classList.add('certo');
      dar('Era este dia! Vamos tentar outra pergunta. 😊', 'dica');
      el.seguinte.classList.add('pulsar');
    } else {
      dar(App.erro(), 'errado');
    }
  });

  $('#cal-dica').addEventListener('click', () => {
    if (resolvida) return;
    mostrarMes();
    dar('💡 O dia está no mês que está a brilhar!', 'dica');
  });
  el.seguinte.addEventListener('click', novaPergunta);
  el.nivel.addEventListener('change', () => {
    nivel = +el.nivel.value;
    seguidos = 0;
    store.set('nivelCalendario', nivel);
    novaPergunta();
  });

  el.nivel.value = nivel;
  document.addEventListener('vista', (e) => { if (e.detail === 'calendario') window.scrollTo(0, 0); });
  novaPergunta();
})();

// Lógica pura (sem DOM): perguntas do calendário e utilitários da hora.
// Funciona no browser (global `Logic`) e em Node (module.exports) para testes.
(function (root) {
  'use strict';

  const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  const DIA_FEMININO = [false, true, true, true, true, true, false];
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const HORAS_POR_EXTENSO = ['doze', 'uma', 'duas', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze'];

  // ---------- utilitários ----------
  const rint = (a, b, rnd) => a + Math.floor(rnd() * (b - a + 1));
  const pick = (arr, rnd) => arr[Math.floor(rnd() * arr.length)];
  const ord = (n, fem) => n + (fem ? '.ª' : '.º');
  const daysIn = (y, m) => new Date(y, m + 1, 0).getDate(); // m: 0-11
  const addDays = (d, k) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + k);
  const pad = (n) => String(n).padStart(2, '0');

  // n-ésimo dia da semana (wd: 0=domingo) do mês m (0-11); n >= 1
  function nthWeekday(y, m, wd, n) {
    const first = new Date(y, m, 1).getDay();
    const day = 1 + ((wd - first + 7) % 7) + (n - 1) * 7;
    return day <= daysIn(y, m) ? new Date(y, m, day) : null;
  }

  function lastWeekday(y, m, wd) {
    const last = daysIn(y, m);
    const lastWd = new Date(y, m, last).getDay();
    return new Date(y, m, last - ((lastWd - wd + 7) % 7));
  }

  // ---------- perguntas do calendário ----------
  // Cada variante devolve { text, date }.
  const VARIANTES = {
    1: [
      (y, r) => {
        const m = rint(0, 11, r), d = rint(1, daysIn(y, m), r);
        return { text: `Clica no dia ${d} de ${MESES[m]}.`, date: new Date(y, m, d) };
      },
      (y, r) => {
        const m = rint(0, 11, r), d = rint(1, daysIn(y, m), r);
        return { text: `Clica no ${ord(d)} dia do ${ord(m + 1)} mês do ano.`, date: new Date(y, m, d) };
      },
    ],
    2: [
      (y, r) => {
        const m = rint(0, 11, r), wd = rint(0, 6, r), n = rint(1, 4, r), f = DIA_FEMININO[wd];
        return { text: `Clica ${f ? 'na' : 'no'} ${ord(n, f)} ${DIAS[wd]} de ${MESES[m]}.`, date: nthWeekday(y, m, wd, n) };
      },
      (y, r) => {
        const m = rint(0, 11, r), wd = rint(0, 6, r), f = DIA_FEMININO[wd];
        return { text: `Clica ${f ? 'na última' : 'no último'} ${DIAS[wd]} de ${MESES[m]}.`, date: lastWeekday(y, m, wd) };
      },
      (y, r) => {
        const m = rint(0, 11, r);
        return { text: `Clica no último dia de ${MESES[m]}.`, date: new Date(y, m, daysIn(y, m)) };
      },
    ],
    3: [
      (y, r) => {
        const m = rint(0, 11, r), wd = rint(0, 6, r), n = rint(1, 4, r), k = rint(1, 6, r);
        const f = DIA_FEMININO[wd], antes = r() < 0.5;
        const base = nthWeekday(y, m, wd, n);
        return {
          text: `Clica no ${ord(k)} dia ${antes ? 'antes' : 'depois'} ${f ? 'da' : 'do'} ${ord(n, f)} ${DIAS[wd]} de ${MESES[m]}.`,
          date: addDays(base, antes ? -k : k),
        };
      },
      (y, r) => {
        const m = rint(1, 11, r);
        return { text: `Clica no dia anterior ao dia 1 de ${MESES[m]}.`, date: new Date(y, m, 0) };
      },
      (y, r) => {
        const m = rint(0, 10, r);
        return { text: `Clica no dia seguinte ao último dia de ${MESES[m]}.`, date: new Date(y, m + 1, 1) };
      },
    ],
    4: [
      (y, r) => {
        const q = rint(1, 4, r), mi = rint(1, 3, r), wd = rint(0, 6, r), n = rint(1, 4, r), f = DIA_FEMININO[wd];
        const m = (q - 1) * 3 + mi - 1;
        return {
          text: `Clica ${f ? 'na' : 'no'} ${ord(n, f)} ${DIAS[wd]} do ${ord(mi)} mês do ${ord(q)} trimestre.`,
          date: nthWeekday(y, m, wd, n),
        };
      },
      (y, r) => {
        const q = rint(1, 4, r), mi = rint(1, 3, r), wd = rint(0, 6, r), n = rint(1, 4, r), k = rint(1, 6, r);
        const f = DIA_FEMININO[wd], antes = r() < 0.5;
        const m = (q - 1) * 3 + mi - 1;
        return {
          text: `Clica no ${ord(k)} dia ${antes ? 'antes' : 'depois'} ${f ? 'da' : 'do'} ${ord(n, f)} ${DIAS[wd]} do ${ord(mi)} mês do ${ord(q)} trimestre.`,
          date: addDays(nthWeekday(y, m, wd, n), antes ? -k : k),
        };
      },
      (y, r) => {
        const q = rint(1, 4, r), mi = rint(1, 3, r), m = (q - 1) * 3 + mi - 1, d = rint(1, daysIn(y, m), r);
        return { text: `Clica no ${ord(d)} dia do ${ord(mi)} mês do ${ord(q)} trimestre.`, date: new Date(y, m, d) };
      },
      (y, r) => {
        const q = rint(1, 4, r), ultimo = r() < 0.5, m = (q - 1) * 3 + (ultimo ? 2 : 0);
        return {
          text: `Clica no ${ultimo ? 'último' : '1.º'} dia do ${ord(q)} trimestre.`,
          date: new Date(y, m, ultimo ? daysIn(y, m) : 1),
        };
      },
    ],
  };

  const NIVEIS_CALENDARIO = 4;

  // Gera uma pergunta; 70% do nível atual, 30% de níveis anteriores (revisão).
  function generateQuestion(year, level, rnd) {
    rnd = rnd || Math.random;
    for (let tentativa = 0; tentativa < 50; tentativa++) {
      const nivel = rnd() < 0.7 ? level : rint(1, level, rnd);
      const q = pick(VARIANTES[nivel], rnd)(year, rnd);
      if (q.date && q.date.getFullYear() === year) return { text: q.text, date: q.date, level: nivel };
    }
    throw new Error('Não foi possível gerar uma pergunta');
  }

  // ---------- relógio ----------
  const formatTime = (h, m) => `${pad(h)}:${pad(m)}`;

  // Lê "3:30", "03:30", "3h30", "3.30" ou "3h". Devolve {h, m} ou null.
  function parseTime(str) {
    const s = String(str).trim().toLowerCase();
    let mt = s.match(/^(\d{1,2})\s*[:h.]\s*(\d{1,2})$/);
    let h, m;
    if (mt) { h = +mt[1]; m = +mt[2]; }
    else if ((mt = s.match(/^(\d{1,2})\s*h?$/))) { h = +mt[1]; m = 0; }
    else return null;
    if (h > 23 || m > 59) return null;
    return { h, m };
  }

  // Frase por extenso. h: 1-12, m: 0-59.
  function timeWords(h, m) {
    const verbo = (hh) => (hh === 1 ? 'É' : 'São');
    const horaTxt = (hh) => HORAS_POR_EXTENSO[hh % 12];
    const proxima = (h % 12) + 1;
    if (m === 0) return h === 1 ? 'É uma hora' : `São ${horaTxt(h)} horas`;
    if (m === 15) return `${verbo(h)} ${horaTxt(h)} e um quarto`;
    if (m === 30) return `${verbo(h)} ${horaTxt(h)} e meia`;
    if (m === 45) return `${verbo(proxima)} ${horaTxt(proxima)} menos um quarto`;
    return `${verbo(h)} ${horaTxt(h)} e ${m} ${m === 1 ? 'minuto' : 'minutos'}`;
  }

  // Gera uma hora (h: 1-12) adequada ao nível (1-5).
  function randomTime(level, rnd) {
    rnd = rnd || Math.random;
    const h = rint(1, 12, rnd);
    const minutos = {
      1: [0],
      2: [0, 30],
      3: [0, 15, 30, 45],
      4: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
    }[level];
    return { h, m: minutos ? pick(minutos, rnd) : rint(0, 59, rnd) };
  }

  // Verifica a resposta escrita. alvo: {h (1-12), m}. pm: só usado em modo 24h.
  function checkTime(parsed, alvo, modo24, pm) {
    if (!parsed || parsed.m !== alvo.m) return false;
    if (modo24) return parsed.h === (alvo.h % 12) + (pm ? 12 : 0);
    return parsed.h % 12 === alvo.h % 12;
  }

  const Logic = {
    DIAS, MESES, NIVEIS_CALENDARIO, daysIn, nthWeekday, lastWeekday, addDays,
    generateQuestion, formatTime, parseTime, timeWords, randomTime, checkTime,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Logic;
  else root.Logic = Logic;
})(typeof window !== 'undefined' ? window : globalThis);

import { criarTemporizador } from './temporizador.js';

// Estado de uma sessão em curso: passo actual, temporizador, navegação.
// Emite eventos via `aoMudar(evento)`: 'passo', 'fim', 'tick', 'pausa'.
export function criarSessao(passos, { aoMudar = () => {} } = {}) {
  let indice = -1;
  let temporizador = null;
  let terminada = false;
  const inicio = { t: null };
  const ultimosAvisos = new Set();

  function irPara(i, t) {
    if (i >= passos.length) { terminar(t, true); return; }
    indice = Math.max(0, i);
    temporizador = criarTemporizador(passos[indice].duracao_s);
    temporizador.iniciar(t);
    ultimosAvisos.clear();
    aoMudar({ tipo: 'passo', indice, passo: passos[indice] });
  }

  function terminar(t, completa) {
    if (terminada) return;
    terminada = true;
    aoMudar({ tipo: 'fim', completa, duracao_s: Math.round((t - inicio.t) / 1000), indice });
  }

  return {
    iniciar(t) { inicio.t = t; irPara(0, t); },
    seguinte(t) { irPara(indice + 1, t); },
    anterior(t) {
      // Se já passou mais de 2 s do passo, recomeça o passo; senão volta atrás.
      irPara(temporizador.decorridoMs > 2000 ? indice : indice - 1, t);
    },
    alternarPausa(t) {
      if (temporizador.pausado) temporizador.iniciar(t); else temporizador.pausar(t);
      aoMudar({ tipo: 'pausa', pausado: temporizador.pausado });
    },
    abandonar(t) { terminar(t, false); },
    tick(t) {
      if (terminada || !temporizador) return;
      temporizador.tick(t);
      const restanteS = temporizador.restanteS;
      // Aviso de contagem final, uma vez por segundo, só nos últimos 3 s.
      if (restanteS <= 3 && restanteS > 0 && !ultimosAvisos.has(restanteS)) {
        ultimosAvisos.add(restanteS);
        aoMudar({ tipo: 'contagem', restanteS });
      }
      aoMudar({ tipo: 'tick', restanteMs: temporizador.restanteMs, restanteS, decorridoMs: temporizador.decorridoMs });
      if (temporizador.terminado) irPara(indice + 1, t);
    },
    get indice() { return indice; },
    get passo() { return passos[indice]; },
    get pausado() { return temporizador?.pausado ?? true; },
    get terminada() { return terminada; },
    get total() { return passos.length; },
  };
}

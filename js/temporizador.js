// Relógio de contagem decrescente sem UI. O tempo é injectado (t em ms)
// para ser testável e robusto a throttling do browser em segundo plano.
export function criarTemporizador(duracaoS) {
  // duracaoS null: contagem crescente sem fim (passos por repetições).
  const semFim = duracaoS == null;
  let restanteMs = semFim ? Infinity : Math.max(0, duracaoS) * 1000;
  let decorridoMs = 0;
  let pausado = true;
  let ultimo = null;

  return {
    iniciar(t) { pausado = false; ultimo = t; },
    pausar(t) { this.tick(t); pausado = true; },
    tick(t) {
      if (!pausado && ultimo != null) {
        decorridoMs += t - ultimo;
        if (!semFim) restanteMs = Math.max(0, restanteMs - (t - ultimo));
        ultimo = t;
      }
      return restanteMs;
    },
    get restanteMs() { return restanteMs; },
    get restanteS() { return semFim ? Infinity : Math.ceil(restanteMs / 1000); },
    get decorridoMs() { return decorridoMs; },
    get semFim() { return semFim; },
    get pausado() { return pausado; },
    get terminado() { return restanteMs <= 0; },
  };
}

// Relógio de contagem decrescente sem UI. O tempo é injectado (t em ms)
// para ser testável e robusto a throttling do browser em segundo plano.
export function criarTemporizador(duracaoS) {
  let restanteMs = Math.max(0, duracaoS) * 1000;
  let pausado = true;
  let ultimo = null;

  return {
    iniciar(t) { pausado = false; ultimo = t; },
    pausar(t) { this.tick(t); pausado = true; },
    tick(t) {
      if (!pausado && ultimo != null) {
        restanteMs = Math.max(0, restanteMs - (t - ultimo));
        ultimo = t;
      }
      return restanteMs;
    },
    get restanteMs() { return restanteMs; },
    get restanteS() { return Math.ceil(restanteMs / 1000); },
    get pausado() { return pausado; },
    get terminado() { return restanteMs <= 0; },
  };
}

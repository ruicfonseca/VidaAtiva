import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarTemporizador } from '../js/temporizador.js';

test('conta para baixo a partir do tempo injectado', () => {
  const t = criarTemporizador(10);
  t.iniciar(1000);
  assert.equal(t.tick(3500), 7500);
  assert.equal(t.restanteS, 8);
  assert.equal(t.terminado, false);
});

test('pausa congela o tempo e continuar retoma sem saltos', () => {
  const t = criarTemporizador(10);
  t.iniciar(0);
  t.pausar(2000);
  t.tick(9000);
  assert.equal(t.restanteMs, 8000);
  t.iniciar(9000);
  t.tick(10000);
  assert.equal(t.restanteMs, 7000);
});

test('nunca fica negativo e marca terminado', () => {
  const t = criarTemporizador(1);
  t.iniciar(0);
  t.tick(5000);
  assert.equal(t.restanteMs, 0);
  assert.equal(t.terminado, true);
});

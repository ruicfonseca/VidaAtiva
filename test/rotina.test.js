import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { expandirRotina, duracaoTotalS, contarExercicios } from '../js/rotina.js';
import { criarSessao } from '../js/sessao.js';

const exercicios = JSON.parse(readFileSync(new URL('../data/exercicios.json', import.meta.url)));
const rotinas = JSON.parse(readFileSync(new URL('../data/rotinas.json', import.meta.url)));

test('todas as rotinas referem exercícios existentes e têm imagem', () => {
  for (const r of rotinas) assert.doesNotThrow(() => expandirRotina(r, exercicios), r.id);
  for (const e of exercicios) assert.ok(e.imagem?.startsWith('img/'), e.id);
});

test('bilateral gera esquerdo e direito com descanso entre passos', () => {
  const r = { id: 'x', descanso_s: 5, passos: [{ exercicio: 'gemeos-parede' }, { exercicio: 'dorsal-crianca', duracao_s: 12 }] };
  const p = expandirRotina(r, exercicios);
  assert.deepEqual(p.map((x) => x.tipo), ['exercicio', 'descanso', 'exercicio', 'descanso', 'exercicio']);
  assert.deepEqual(p.filter((x) => x.tipo === 'exercicio').map((x) => x.lado), ['esquerdo', 'direito', null]);
  assert.equal(p.at(-1).duracao_s, 12, 'a rotina sobrepõe a duração por omissão');
  assert.equal(duracaoTotalS(p), 30 + 5 + 30 + 5 + 12);
  assert.equal(contarExercicios(p), 3);
});

test('sessão avança sozinha, recua e termina', () => {
  const r = { id: 'x', descanso_s: 0, passos: [{ exercicio: 'punhos-extensao', duracao_s: 2 }] };
  const eventos = [];
  const s = criarSessao(expandirRotina(r, exercicios), { aoMudar: (e) => eventos.push(e.tipo) });
  s.iniciar(0);
  assert.equal(s.passo.lado, 'esquerdo');
  s.tick(1000); s.tick(2500);
  assert.equal(s.passo.lado, 'direito', 'passa ao lado direito quando o tempo acaba');
  s.tick(2600); s.anterior(2600);
  assert.equal(s.passo.lado, 'esquerdo', 'anterior no início do passo recua');
  s.seguinte(3000); s.tick(6000);
  assert.equal(s.terminada, true);
  assert.equal(eventos.at(-1), 'fim');
  assert.ok(eventos.includes('contagem'), 'emite a contagem final');
});

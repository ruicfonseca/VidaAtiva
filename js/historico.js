import { ler, escrever } from './armazenamento.js';

const CHAVE = 'historico.v1';

export function listarSessoes() {
  const lista = ler(CHAVE, []);
  return Array.isArray(lista) ? lista : [];
}

export function registarSessao(sessao) {
  const lista = listarSessoes();
  lista.push(sessao);
  escrever(CHAVE, lista.slice(-500));
  return sessao;
}

// Estatísticas simples para o ecrã inicial.
export function resumo(lista, agora = new Date()) {
  const dias = new Set(lista.filter((s) => s.completa).map((s) => s.inicio.slice(0, 10)));
  const semana = [...Array(7)].map((_, i) => {
    const d = new Date(agora); d.setDate(d.getDate() - i);
    return d.toISOString().slice(0, 10);
  });
  let seguidos = 0;
  for (const dia of semana) { if (dias.has(dia)) seguidos++; else break; }
  return {
    total: lista.length,
    estaSemana: semana.filter((d) => dias.has(d)).length,
    diasSeguidos: seguidos,
    ultima: lista.at(-1) ?? null,
  };
}

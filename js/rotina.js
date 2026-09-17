// Expande uma rotina numa lista plana de passos executáveis:
// cada exercício bilateral vira dois passos (esquerdo, direito) e entre
// passos entra um descanso, excepto depois do último.
export function expandirRotina(rotina, exercicios) {
  const porId = new Map(exercicios.map((e) => [e.id, e]));
  const passos = [];

  rotina.passos.forEach((p, i) => {
    const ex = porId.get(p.exercicio);
    if (!ex) throw new Error(`Exercício desconhecido: ${p.exercicio}`);
    const porRepeticoes = ex.tipo === 'repeticoes';
    const duracao = porRepeticoes ? null : (p.duracao_s ?? ex.duracao_s);
    const repeticoes = porRepeticoes ? (p.repeticoes ?? ex.repeticoes) : null;
    const lados = ex.bilateral ? ['esquerdo', 'direito'] : [null];

    lados.forEach((lado, j) => {
      if (passos.length > 0 && rotina.descanso_s > 0) {
        passos.push({ tipo: 'descanso', duracao_s: rotina.descanso_s, seguinte: { exercicio: ex, lado } });
      }
      passos.push({ tipo: 'exercicio', exercicio: ex, lado, duracao_s: duracao, repeticoes, manter_s: ex.manter_s ?? 0, ordem: i, parte: j });
    });
  });

  return passos;
}

// Estimativa para passos por repetições: 4 s por repetição mais o tempo de manter.
export function estimarS(passo) {
  if (passo.duracao_s != null) return passo.duracao_s;
  return passo.repeticoes * (4 + (passo.manter_s ?? 0));
}

export function duracaoTotalS(passos) {
  return passos.reduce((s, p) => s + estimarS(p), 0);
}

// Conta exercícios da rotina, não lados: um bilateral conta uma vez.
export function contarExercicios(passos) {
  return new Set(passos.filter((p) => p.tipo === 'exercicio').map((p) => p.ordem)).size;
}

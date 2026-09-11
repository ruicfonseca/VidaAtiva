// Expande uma rotina numa lista plana de passos executáveis:
// cada exercício bilateral vira dois passos (esquerdo, direito) e entre
// passos entra um descanso, excepto depois do último.
export function expandirRotina(rotina, exercicios) {
  const porId = new Map(exercicios.map((e) => [e.id, e]));
  const passos = [];

  rotina.passos.forEach((p, i) => {
    const ex = porId.get(p.exercicio);
    if (!ex) throw new Error(`Exercício desconhecido: ${p.exercicio}`);
    const duracao = p.duracao_s ?? ex.duracao_s;
    const lados = ex.bilateral ? ['esquerdo', 'direito'] : [null];

    lados.forEach((lado, j) => {
      if (passos.length > 0 && rotina.descanso_s > 0) {
        passos.push({ tipo: 'descanso', duracao_s: rotina.descanso_s, seguinte: { exercicio: ex, lado } });
      }
      passos.push({ tipo: 'exercicio', exercicio: ex, lado, duracao_s: duracao, ordem: i, parte: j });
    });
  });

  return passos;
}

export function duracaoTotalS(passos) {
  return passos.reduce((s, p) => s + p.duracao_s, 0);
}

export function contarExercicios(passos) {
  return passos.filter((p) => p.tipo === 'exercicio').length;
}

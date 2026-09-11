import { criarSessao } from './sessao.js';
import { expandirRotina, contarExercicios, duracaoTotalS } from './rotina.js';
import { falar, vibrar, desbloquear, vozActiva, alternarVoz } from './voz.js';
import { registarSessao } from './historico.js';
import { inserirImagens } from './catalogo.js';
import { html, formatarTempo } from './util.js';

const NUMEROS = { 3: 'três', 2: 'dois', 1: 'um' };

export function iniciarReprodutor({ rotina, exercicios, raiz, aoTerminar }) {
  const passos = expandirRotina(rotina, exercicios);
  const totalExercicios = contarExercicios(passos);
  const totalS = duracaoTotalS(passos);
  let decorridoAntesS = 0;
  let exerciciosFeitos = 0;
  let bloqueio = null;
  let intervalo = null;
  let saidaExterna = false;
  const inicioISO = new Date().toISOString();

  desbloquear();
  pedirBloqueio();

  const sessao = criarSessao(passos, { aoMudar: tratarEvento });

  raiz.innerHTML = html`
    <section class="reprodutor" aria-live="polite">
      <header class="reprodutor__topo">
        <button class="botao botao--icone" data-accao="sair" aria-label="Sair da sessão">✕</button>
        <div class="progresso"><div class="progresso__barra" data-el="progresso"></div></div>
        <button class="botao botao--icone" data-accao="voz" aria-label="Voz ligada ou desligada" data-el="voz">${vozActiva() ? '🔊' : '🔇'}</button>
      </header>
      <div class="reprodutor__contador" data-el="contador">Passo 1 de ${totalExercicios}</div>
      <div class="ilustracao ilustracao--grande" data-el="ilustracao"></div>
      <h1 class="reprodutor__nome" data-el="nome"></h1>
      <div class="reprodutor__lado" data-el="lado"></div>
      <div class="reprodutor__tempo" data-el="tempo">0</div>
      <p class="reprodutor__pista" data-el="pista"></p>
      <p class="reprodutor__seguinte" data-el="seguinte"></p>
      <footer class="reprodutor__controlos">
        <button class="botao botao--grande" data-accao="anterior" aria-label="Anterior">◀</button>
        <button class="botao botao--grande botao--principal" data-accao="pausa" data-el="pausa" aria-label="Pausa">❚❚</button>
        <button class="botao botao--grande" data-accao="seguinte" aria-label="Seguinte">▶</button>
      </footer>
    </section>`;

  const el = (nome) => raiz.querySelector(`[data-el="${nome}"]`);

  raiz.querySelector('.reprodutor').addEventListener('click', (ev) => {
    const accao = ev.target.closest('[data-accao]')?.dataset.accao;
    if (!accao) return;
    const t = Date.now();
    if (accao === 'anterior') sessao.anterior(t);
    if (accao === 'seguinte') sessao.seguinte(t);
    if (accao === 'pausa') sessao.alternarPausa(t);
    if (accao === 'sair') sessao.abandonar(t);
    if (accao === 'voz') el('voz').textContent = alternarVoz() ? '🔊' : '🔇';
  });

  sessao.iniciar(Date.now());
  intervalo = setInterval(() => sessao.tick(Date.now()), 100);
  document.addEventListener('visibilitychange', aoMudarVisibilidade);

  function tratarEvento(ev) {
    if (ev.tipo === 'passo') mostrarPasso(ev.indice, ev.passo);
    if (ev.tipo === 'tick') mostrarTempo(ev);
    if (ev.tipo === 'contagem') falar(NUMEROS[ev.restanteS], { interromper: true });
    if (ev.tipo === 'pausa') {
      el('pausa').textContent = ev.pausado ? '▶' : '❚❚';
      el('pausa').setAttribute('aria-label', ev.pausado ? 'Continuar' : 'Pausa');
      raiz.querySelector('.reprodutor').classList.toggle('reprodutor--pausado', ev.pausado);
      if (ev.pausado) falar('Pausa'); else falar('Continua');
    }
    if (ev.tipo === 'fim') terminar(ev);
  }

  function mostrarPasso(indice, passo) {
    decorridoAntesS = passos.slice(0, indice).reduce((s, p) => s + p.duracao_s, 0);
    exerciciosFeitos = passos.slice(0, indice).filter((p) => p.tipo === 'exercicio').length;
    const proximo = passos.slice(indice + 1).find((p) => p.tipo === 'exercicio');
    const ex = passo.tipo === 'exercicio' ? passo.exercicio : passo.seguinte.exercicio;
    const lado = passo.tipo === 'exercicio' ? passo.lado : passo.seguinte.lado;

    raiz.querySelector('.reprodutor').classList.toggle('reprodutor--descanso', passo.tipo === 'descanso');
    el('contador').textContent = `Exercício ${Math.min(exerciciosFeitos + 1, totalExercicios)} de ${totalExercicios}`;
    el('nome').textContent = passo.tipo === 'descanso' ? 'Descanso' : ex.nome;
    el('lado').textContent = passo.tipo === 'descanso' ? `A seguir: ${ex.nome}${lado ? `, lado ${lado}` : ''}` : (lado ? `Lado ${lado}` : '');
    el('pista').textContent = passo.tipo === 'descanso' ? '' : (ex.pistas[passo.parte % ex.pistas.length] ?? '');
    el('seguinte').textContent = passo.tipo === 'descanso' ? '' : (proximo ? `A seguir: ${proximo.exercicio.nome}${proximo.lado ? `, lado ${proximo.lado}` : ''}` : 'Último exercício');
    el('ilustracao').dataset.imagem = ex.imagem;
    inserirImagens(raiz);

    vibrar(200);
    if (passo.tipo === 'descanso') {
      falar(`Descanso. A seguir, ${ex.nome}${lado ? `, lado ${lado}` : ''}.`);
    } else {
      falar(`${ex.nome}${lado ? `, lado ${lado}` : ''}. ${passo.duracao_s} segundos. ${el('pista').textContent}`);
    }
  }

  function mostrarTempo({ restanteMs, restanteS }) {
    el('tempo').textContent = restanteS;
    const passoS = sessao.passo.duracao_s;
    const decorrido = decorridoAntesS + (passoS - restanteMs / 1000);
    el('progresso').style.width = `${Math.min(100, (decorrido / totalS) * 100)}%`;
  }

  function terminar(ev) {
    clearInterval(intervalo);
    document.removeEventListener('visibilitychange', aoMudarVisibilidade);
    bloqueio?.release?.().catch(() => {});
    const feitos = ev.completa ? totalExercicios : exerciciosFeitos;
    const registo = {
      rotina: rotina.id, nome: rotina.nome, inicio: inicioISO,
      duracao_s: ev.duracao_s, exercicios: feitos, total: totalExercicios, completa: ev.completa,
    };
    if (feitos > 0) registarSessao(registo);
    if (ev.completa) { vibrar([200, 100, 200, 100, 400]); falar('Sessão concluída. Bom trabalho.'); }
    else speechSynthesis?.cancel();
    aoTerminar(registo, { navegar: !saidaExterna });
  }

  async function pedirBloqueio() {
    try { bloqueio = await navigator.wakeLock?.request('screen'); } catch { bloqueio = null; }
  }
  function aoMudarVisibilidade() {
    if (document.visibilityState === 'visible') { pedirBloqueio(); sessao.tick(Date.now()); }
  }

  // Chamado pelo router quando o utilizador sai por navegação (voltar).
  return { parar() { saidaExterna = true; if (!sessao.terminada) sessao.abandonar(Date.now()); } };
}

export { formatarTempo };

import { carregarCatalogo, inserirImagens } from './catalogo.js';
import { expandirRotina, contarExercicios, duracaoTotalS } from './rotina.js';
import { iniciarReprodutor } from './reprodutor.js';
import { listarSessoes, resumo } from './historico.js';
import { html, bruto, formatarTempo, formatarData } from './util.js';

const raiz = document.getElementById('app');
let catalogo = null;
let reprodutorActivo = null;
let ultimoRegisto = null;
let filtroEquipamento = 'todos'; // 'todos' | 'nenhum' | 'elástico'

function equipamentoDaRotina(rot) {
  return [...new Set(rot.passos.flatMap((p) => catalogo.porId.get(p.exercicio)?.equipamento ?? []))];
}
function distintivosEquipamento(lista) {
  return lista.map((e) => html`<span class="etiqueta etiqueta--equip">${e}</span>`).join('');
}

const rotas = {
  '': ecraInicio,
  'rotina': ecraRotina,
  'sessao': ecraSessao,
  'fim': ecraFim,
  'exercicios': ecraExercicios,
  'exercicio': ecraExercicio,
  'historico': ecraHistorico,
};

async function navegar() {
  catalogo ??= await carregarCatalogo();
  if (reprodutorActivo) { reprodutorActivo.parar(); reprodutorActivo = null; }
  const [nome = '', arg] = location.hash.replace(/^#\/?/, '').split('/');
  const ecra = rotas[nome] ?? ecraInicio;
  window.scrollTo(0, 0);
  const conteudo = ecra(arg);
  // O ecrã da sessão desenha-se a si próprio e devolve null.
  if (conteudo != null) { raiz.innerHTML = conteudo; inserirImagens(raiz); }
}

function cabecalho(titulo, voltar = '#/') {
  return html`<header class="topo">
    ${voltar ? bruto(html`<a class="botao botao--icone" href="${voltar}" aria-label="Voltar">‹</a>`) : ''}
    <h1 class="topo__titulo">${titulo}</h1>
  </header>`;
}

function ecraInicio() {
  const r = resumo(listarSessoes());
  return html`
    <header class="topo topo--inicio">
      <h1 class="marca">VidaAtiva</h1>
      <nav class="topo__nav">
        <a class="botao botao--texto" href="#/exercicios">Exercícios</a>
        <a class="botao botao--texto" href="#/historico">Histórico</a>
      </nav>
    </header>
    <section class="resumo">
      <div class="resumo__item"><strong>${r.diasSeguidos}</strong><span>dias seguidos</span></div>
      <div class="resumo__item"><strong>${r.estaSemana}</strong><span>esta semana</span></div>
      <div class="resumo__item"><strong>${r.total}</strong><span>sessões</span></div>
    </section>
    <h2 class="seccao">Rotinas</h2>
    <ul class="lista">
      ${bruto(catalogo.rotinas.map((rot) => {
        const passos = expandirRotina(rot, catalogo.exercicios);
        return html`<li><a class="cartao" href="#/rotina/${rot.id}">
          <div class="cartao__texto">
            <h3>${rot.nome}</h3>
            <p>${rot.descricao}</p>
            <p class="cartao__meta">${contarExercicios(passos)} exercícios · ${formatarTempo(duracaoTotalS(passos))} ${bruto(distintivosEquipamento(equipamentoDaRotina(rot)))}</p>
          </div>
          <span class="cartao__seta">›</span>
        </a></li>`;
      }).join(''))}
    </ul>`;
}

function ecraRotina(id) {
  const rot = catalogo.rotinas.find((r) => r.id === id);
  if (!rot) return ecraInicio();
  const passos = expandirRotina(rot, catalogo.exercicios);
  return html`
    ${bruto(cabecalho(rot.nome))}
    <p class="intro">${rot.descricao}</p>
    <p class="intro cartao__meta">${contarExercicios(passos)} exercícios · ${formatarTempo(duracaoTotalS(passos))} · ${rot.descanso_s} s de descanso entre passos ${bruto(distintivosEquipamento(equipamentoDaRotina(rot)))}</p>
    <ol class="lista lista--passos">
      ${bruto(rot.passos.map((p) => {
        const ex = catalogo.porId.get(p.exercicio);
        return html`<li class="passo">
          <div class="ilustracao ilustracao--mini" data-imagem="${ex.imagem}"></div>
          <div class="passo__texto"><strong>${ex.nome}</strong><span>${p.duracao_s ?? ex.duracao_s} s${ex.bilateral ? ' por lado' : ''}</span></div>
        </li>`;
      }).join(''))}
    </ol>
    <div class="rodape-fixo">
      <a class="botao botao--principal botao--largo" href="#/sessao/${rot.id}">Começar</a>
    </div>`;
}

function ecraSessao(id) {
  const rot = catalogo.rotinas.find((r) => r.id === id);
  if (!rot) return ecraInicio();
  raiz.innerHTML = '';
  reprodutorActivo = iniciarReprodutor({
    rotina: rot, exercicios: catalogo.exercicios, raiz,
    aoTerminar(registo, { navegar }) {
      reprodutorActivo = null;
      ultimoRegisto = registo;
      if (navegar) location.hash = registo.completa ? '#/fim' : '#/';
    },
  });
  return null;
}

function ecraFim() {
  const r = ultimoRegisto;
  if (!r) return ecraInicio();
  return html`
    <section class="fim">
      <div class="fim__marca">✓</div>
      <h1>Sessão concluída</h1>
      <p class="fim__rotina">${r.nome}</p>
      <div class="resumo">
        <div class="resumo__item"><strong>${formatarTempo(r.duracao_s)}</strong><span>duração</span></div>
        <div class="resumo__item"><strong>${r.exercicios}</strong><span>exercícios</span></div>
      </div>
      <a class="botao botao--principal botao--largo" href="#/">Início</a>
      <a class="botao botao--largo" href="#/sessao/${r.rotina}">Repetir</a>
    </section>`;
}

function ecraExercicios() {
  const filtros = [['todos', 'Todos'], ['nenhum', 'Sem material'], ['elástico', 'Com elástico']];
  const lista = catalogo.exercicios.filter((ex) => {
    if (filtroEquipamento === 'todos') return true;
    if (filtroEquipamento === 'nenhum') return ex.equipamento.length === 0;
    return ex.equipamento.includes(filtroEquipamento);
  });
  return html`
    ${bruto(cabecalho('Exercícios'))}
    <div class="filtros" role="tablist">
      ${bruto(filtros.map(([v, n]) => html`<button class="filtro ${v === filtroEquipamento ? 'filtro--activo' : ''}" data-filtro="${v}" role="tab" aria-selected="${v === filtroEquipamento}">${n}</button>`).join(''))}
    </div>
    <ul class="grelha">
      ${bruto(lista.map((ex) => html`<li><a class="azulejo" href="#/exercicio/${ex.id}">
        <div class="ilustracao ilustracao--media" data-imagem="${ex.imagem}"></div>
        <strong>${ex.nome}</strong>
        <span class="cartao__meta">${ex.duracao_s} s${ex.bilateral ? ' por lado' : ''} ${bruto(distintivosEquipamento(ex.equipamento))}</span>
      </a></li>`).join(''))}
    </ul>`;
}

function ecraExercicio(id) {
  const ex = catalogo.porId.get(id);
  if (!ex) return ecraExercicios();
  return html`
    ${bruto(cabecalho(ex.nome, '#/exercicios'))}
    <div class="ilustracao ilustracao--grande" data-imagem="${ex.imagem}"></div>
    <p class="etiquetas">${bruto(ex.alvo.map((a) => html`<span class="etiqueta">${a}</span>`).join(''))} <span class="etiqueta etiqueta--suave">${ex.posicao}</span> <span class="etiqueta etiqueta--suave">${ex.duracao_s} s${ex.bilateral ? ' por lado' : ''}</span> ${bruto(distintivosEquipamento(ex.equipamento))}</p>
    <h2 class="seccao">Como fazer</h2>
    <ol class="instrucoes">${bruto(ex.instrucoes.map((i) => html`<li>${i}</li>`).join(''))}</ol>
    <h2 class="seccao">Pistas</h2>
    <ul class="instrucoes">${bruto(ex.pistas.map((i) => html`<li>${i}</li>`).join(''))}</ul>
    <h2 class="seccao seccao--aviso">Evitar se</h2>
    <ul class="instrucoes">${bruto(ex.evitar_se.map((i) => html`<li>${i}</li>`).join(''))}</ul>`;
}

function ecraHistorico() {
  const lista = listarSessoes().slice().reverse();
  return html`
    ${bruto(cabecalho('Histórico'))}
    ${lista.length === 0 ? bruto('<p class="intro">Ainda não há sessões. Começa por uma rotina.</p>') : ''}
    <ul class="lista">
      ${bruto(lista.map((s) => html`<li class="cartao cartao--plano">
        <div class="cartao__texto">
          <h3>${s.nome}</h3>
          <p class="cartao__meta">${formatarData(s.inicio)} · ${formatarTempo(s.duracao_s)} · ${s.exercicios}/${s.total} exercícios</p>
        </div>
        <span class="etiqueta ${s.completa ? '' : 'etiqueta--suave'}">${s.completa ? 'completa' : 'parcial'}</span>
      </li>`).join(''))}
    </ul>`;
}

raiz.addEventListener('click', (ev) => {
  const filtro = ev.target.closest('[data-filtro]')?.dataset.filtro;
  if (filtro) { filtroEquipamento = filtro; navegar(); }
});

window.addEventListener('hashchange', navegar);
navegar();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

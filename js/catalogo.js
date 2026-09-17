// Carrega os dados e as ilustrações. As ilustrações são SVG do próprio
// repositório, inseridas inline para herdarem as cores do tema.
let cache = null;
const imagens = new Map();

export async function carregarCatalogo() {
  if (cache) return cache;
  const [exercicios, rotinas] = await Promise.all([
    fetch('data/exercicios.json').then((r) => r.json()),
    fetch('data/rotinas.json').then((r) => r.json()),
  ]);
  cache = { exercicios, rotinas, porId: new Map(exercicios.map((e) => [e.id, e])) };
  return cache;
}

export async function carregarImagem(url) {
  if (!imagens.has(url)) {
    imagens.set(url, fetch(url).then((r) => (r.ok ? r.text() : '')).catch(() => ''));
  }
  return imagens.get(url);
}

// Preenche todos os <div data-imagem="url"> do contentor.
export async function inserirImagens(raiz) {
  const alvos = [...raiz.querySelectorAll('[data-imagem]')];
  await Promise.all(alvos.map(async (el) => {
    const url = el.dataset.imagem;
    if (/\.(jpe?g|png|webp)$/i.test(url)) {
      const img = document.createElement('img');
      img.src = url; img.alt = ''; img.loading = 'lazy';
      el.replaceChildren(img);
      el.classList.add('ilustracao--foto');
      return;
    }
    const svg = await carregarImagem(url);
    // Só inserimos SVG do nosso próprio repositório.
    el.innerHTML = svg.startsWith('<svg') ? svg : '';
    el.classList.remove('ilustracao--foto');
  }));
}

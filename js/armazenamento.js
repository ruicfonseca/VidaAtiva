// Wrapper de localStorage com prefixo e versão. Toda a leitura e escrita é
// tolerante a falhas: modo privado, quota cheia, JSON corrompido.
const PREFIXO = 'vidaativa.';

export function ler(chave, porOmissao) {
  try {
    const bruto = localStorage.getItem(PREFIXO + chave);
    return bruto == null ? porOmissao : JSON.parse(bruto);
  } catch { return porOmissao; }
}

export function escrever(chave, valor) {
  try { localStorage.setItem(PREFIXO + chave, JSON.stringify(valor)); return true; }
  catch { return false; }
}

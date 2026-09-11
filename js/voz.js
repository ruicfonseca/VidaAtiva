// Pistas faladas (Web Speech API) e vibração. Tudo opcional: se a API não
// existir, as funções não fazem nada.
import { ler, escrever } from './armazenamento.js';

const definicoes = ler('definicoes.v1', { voz: true });
let vozEscolhida = null;

function escolherVoz() {
  if (!('speechSynthesis' in window)) return;
  const vozes = speechSynthesis.getVoices();
  vozEscolhida = vozes.find((v) => v.lang === 'pt-PT') ?? vozes.find((v) => v.lang.startsWith('pt')) ?? null;
}
if ('speechSynthesis' in window) {
  escolherVoz();
  speechSynthesis.addEventListener('voiceschanged', escolherVoz);
}

export function vozActiva() { return definicoes.voz; }
export function alternarVoz() {
  definicoes.voz = !definicoes.voz;
  escrever('definicoes.v1', definicoes);
  if (!definicoes.voz) speechSynthesis?.cancel();
  return definicoes.voz;
}

export function falar(texto, { interromper = true } = {}) {
  if (!definicoes.voz || !('speechSynthesis' in window)) return;
  if (interromper) speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texto);
  u.lang = 'pt-PT';
  if (vozEscolhida) u.voice = vozEscolhida;
  u.rate = 1;
  speechSynthesis.speak(u);
}

// No iOS a síntese só funciona depois de um gesto do utilizador; chamar
// isto no clique de "Começar" desbloqueia as chamadas seguintes.
export function desbloquear() {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(' ');
  u.volume = 0;
  speechSynthesis.speak(u);
}

export function vibrar(padrao) {
  try { navigator.vibrate?.(padrao); } catch { /* sem vibração */ }
}

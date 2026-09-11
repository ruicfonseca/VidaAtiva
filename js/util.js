export function escapar(v) {
  return String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Template literal que escapa os valores interpolados. Um valor marcado
// com `bruto()` entra sem escapar (HTML gerado por nós).
export function html(partes, ...valores) {
  return partes.reduce((s, p, i) => {
    const v = valores[i - 1];
    const texto = v == null ? '' : v.__bruto ? v.valor : Array.isArray(v) ? v.map((x) => (x?.__bruto ? x.valor : escapar(x))).join('') : escapar(v);
    return s + texto + p;
  });
}
export const bruto = (valor) => ({ __bruto: true, valor });

export function formatarTempo(segundos) {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return m > 0 ? `${m} min${s ? ` ${s} s` : ''}` : `${s} s`;
}

export function formatarData(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' }) +
    ', ' + d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

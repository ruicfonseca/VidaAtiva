# VidaAtiva

Aplicação de exercícios para telemóvel. Começa pelos alongamentos; mobilidade e força vêm nas fases seguintes.

- PWA sem framework, sem build e sem dependências. HTML, CSS e JavaScript em módulos.
- Funciona offline depois da primeira visita. Dados guardados no browser.
- Doze alongamentos com ilustração, três rotinas prontas, reprodutor com temporizador, pistas faladas, vibração, ecrã sempre ligado e histórico de sessões.
- Plano e decisões de desenho em [PLANO.md](PLANO.md).

## Correr localmente

Precisa de um servidor HTTP (os módulos e o `fetch` não funcionam em `file://`):

```sh
python3 -m http.server 8080
```

Depois abrir http://localhost:8080. Para testar no telemóvel na mesma rede, usar o IP do computador em vez de `localhost`. Sem HTTPS, o service worker e a instalação não funcionam; o resto sim.

## Instalar no telemóvel

1. No GitHub, em Settings, Pages, escolher "Deploy from a branch", branch `main`, pasta `/ (root)`.
2. Abrir `https://ruicfonseca.github.io/VidaAtiva/` no telemóvel.
3. Android (Chrome): menu, "Adicionar ao ecrã principal". iPhone (Safari): partilhar, "Adicionar ao ecrã principal".

A partir daí abre como app, funciona sem rede e mantém o ecrã ligado durante a sessão.

## Testes

```sh
npm test
```

Testa o temporizador, a expansão de rotinas e a máquina de estados da sessão. A interface é verificada à mão no browser.

## Estrutura

```
index.html            ecrã único, navegação por hash
styles.css
manifest.webmanifest  instalação
sw.js                 cache offline
js/app.js             router e ecrãs
js/reprodutor.js      UI da sessão em curso
js/sessao.js          máquina de estados da sessão (sem UI)
js/temporizador.js    contagem decrescente (sem UI)
js/rotina.js          expansão de rotina em passos
js/voz.js             síntese de voz e vibração
js/historico.js       registo de sessões e resumo
js/armazenamento.js   localStorage tolerante a falhas
js/catalogo.js        carregamento de dados e ilustrações
js/util.js            template HTML com escape, formatação
data/exercicios.json  catálogo
data/rotinas.json     rotinas
img/*.svg             ilustrações (traço, cor herdada do tema)
test/                 node --test
```

## Estado

v0 feita. Próximo: v1 (editor de rotinas, exportar e importar JSON, definições). Ver [PLANO.md](PLANO.md).

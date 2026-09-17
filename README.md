# VidaAtiva

Aplicação de exercícios para telemóvel. Começa pelos alongamentos; mobilidade e força vêm nas fases seguintes.

- PWA sem framework, sem build e sem dependências. HTML, CSS e JavaScript em módulos.
- Funciona offline depois da primeira visita. Dados guardados no browser.
- Vinte e cinco exercícios com ilustração ou fotografia: alongamentos sem material, com elástico de resistência, e mobilidade e controlo da coluna lombar. Cinco rotinas prontas, reprodutor com temporizador ou contagem de repetições, pistas faladas, vibração, ecrã sempre ligado e histórico de sessões.
- Catálogo com filtro por material (sem material, com elástico).
- Plano e decisões de desenho em [PLANO.md](PLANO.md).

## Correr localmente

Precisa de um servidor HTTP (os módulos e o `fetch` não funcionam em `file://`):

```sh
python3 -m http.server 8080
```

Depois abrir http://localhost:8080. Para testar no telemóvel na mesma rede, usar o IP do computador em vez de `localhost`. Sem HTTPS, o service worker e a instalação não funcionam; o resto sim.

## Instalar no telemóvel

Cada push para `main` corre os testes e publica em GitHub Pages através de `.github/workflows/pages.yml` (fonte do Pages: GitHub Actions).

1. Abrir `https://ruicfonseca.github.io/VidaAtiva/` no telemóvel.
2. Android (Chrome): menu, "Adicionar ao ecrã principal". iPhone (Safari): partilhar, "Adicionar ao ecrã principal".

A partir daí abre como app, funciona sem rede e mantém o ecrã ligado durante a sessão.

## Imagens

Um exercício pode ter `imagem` em SVG (ilustração gerada) ou em JPEG, PNG ou WebP (fotografia). As fotografias em `img/fotos/` vêm de um plano de exercício entregue ao utilizador por um terceiro; se for preciso retirá-las, basta apagar a pasta e voltar a apontar `imagem` para o SVG correspondente.

### Ilustrações geradas

Cada pose está descrita como uma lista de segmentos em `ferramentas/gerar_ilustracoes.py`. A zona alongada vai em `alvo` (cor de acento com halo), o elástico em `elastico`, as setas em `seta` ou `arco`. Depois de alterar:

```sh
python3 ferramentas/gerar_ilustracoes.py
```

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
img/*.svg             ilustrações geradas, não editar à mão
img/fotos/*.jpg       fotografias recortadas do plano de exercício da coluna lombar entregue ao utilizador
ferramentas/gerar_ilustracoes.py  poses como dados; gera img/*.svg
test/                 node --test
```

## Estado

v0 feita, com exercícios por repetições e fotografias já suportados. Próximo: v1 (descanso maior ao mudar de posição, contagem de preparação, exportar e importar JSON, definições, editor de rotinas). Ver [PLANO.md](PLANO.md).

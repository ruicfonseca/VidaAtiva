# Plano: aplicação local de exercícios (fase 1, alongamentos)

## 1. Decisões que têm de ser tomadas primeiro

Estas decisões mudam o desenho da aplicação. Assumi as respostas marcadas com **[assumido]**; se alguma estiver errada, o plano muda.

| Questão | Opções | Decisão |
|---|---|---|
| Onde é usada? | Telemóvel no chão / tablet / PC | **[assumido]** Telemóvel, ecrã grande à distância. Alongar faz-se no chão, não à secretária. |
| O que significa "local"? | Ficheiro HTML aberto no browser / servidor Python / app nativa | **[assumido]** PWA: um único site estático, sem servidor, dados no browser. Funciona offline e instala-se no ecrã inicial. |
| Conteúdo visual? | Só texto / ilustrações / vídeo | **[assumido]** Texto e pistas verbais na v0. Ilustrações são o custo maior e não são o que faz a aplicação ser usada. |
| O que se regista? | Nada / sessões feitas / dor e amplitude | **[assumido]** Sessões feitas (data, rotina, duração). Métricas de dor e amplitude ficam para depois. |
| Onde vive no repositório? | Raiz / subpasta | Repositório próprio, `VidaAtiva`. |

## 2. Pontos críticos (o que me parece fraco na ideia inicial)

1. **"Local" no PC é o sítio errado para alongamentos.** Se a aplicação corre só no portátil, vai ficar por usar. O valor está em ter o temporizador ao lado do tapete. Por isso PWA, não app de secretária.
2. **Um catálogo grande é trabalho perdido.** Dez a doze alongamentos bem descritos cobrem 90% do uso. Cem alongamentos sem rotina são uma lista que nunca se abre.
3. **O modelo de dados tem de nascer genérico.** "Começando pelos alongamentos" implica força e mobilidade a seguir. Se o modelo for só `duração + lado`, a fase 2 obriga a reescrever. O exercício tem de ter `tipo` (tempo ou repetições) desde o início, mesmo que a UI só mostre tempo.
4. **localStorage não é armazenamento.** O browser apaga-o sem aviso. Exportar e importar JSON entra na v1, não no "um dia".
5. **Service worker não funciona em `file://`.** Para instalar no telemóvel e funcionar offline, o site tem de ser servido por HTTP. Opção mais barata: GitHub Pages a partir deste repositório. Alternativa sem internet: `python -m http.server` na rede local. Ambas são gratuitas; a primeira é mais cómoda.
6. **A aplicação não substitui prática correcta.** Alongamento estático: 15 a 30 segundos por posição, 2 a 4 repetições, sem balanço, sem dor, de preferência com o corpo aquecido. Alongamento estático longo imediatamente antes de treino de força tende a reduzir ligeiramente o desempenho. Estes valores são as recomendações gerais (ACSM); não tenho como verificar o teu caso concreto, e se houver lesão ou dor persistente isto é para um fisioterapeuta, não para uma app.

## 3. Arquitectura

Sem framework, sem build, sem dependências. HTML + CSS + JavaScript (ES modules). Motivo: é uma aplicação de uma pessoa, e cada dependência é manutenção futura.

```
VidaAtiva/
  index.html              ecrã único, navegação por estados
  styles.css
  manifest.webmanifest    instalação no telemóvel
  sw.js                   cache offline
  js/
    app.js                arranque, router de ecrãs
    catalogo.js           carrega e valida data/*.json
    rotina.js             expande uma rotina em passos (lado esquerdo, direito, descanso)
    temporizador.js       relógio com pausa, avanço, recuo; sem UI
    reprodutor.js         UI do passo actual, controlos
    voz.js                Web Speech API (pistas faladas) + Vibration API
    historico.js          registo de sessões, exportar/importar
    armazenamento.js      wrapper de localStorage com versão de schema
  data/
    exercicios.json
    rotinas.json
  test/
    temporizador.test.js  testes do relógio e da expansão de rotina (node --test)
```

APIs do browser a usar:
- **Wake Lock**: manter o ecrã ligado durante a sessão. Sem isto o telemóvel apaga-se a meio.
- **Web Speech (síntese)**: "Lado direito, 30 segundos", "Cinco, quatro, ...". Permite não olhar para o ecrã.
- **Vibration**: aviso de fim de passo quando o som está desligado.
- **Service worker**: offline.

## 4. Modelo de dados

```jsonc
// exercicios.json
{
  "id": "isquiotibiais-sentado",
  "nome": "Isquiotibiais, sentado",
  "categoria": "alongamento",           // futuro: forca, mobilidade
  "tipo": "tempo",                       // "tempo" | "repeticoes"
  "duracao_s": 30,                       // se tipo = tempo
  "bilateral": true,                     // gera passo esquerdo + direito
  "alvo": ["isquiotibiais"],
  "posicao": "sentado",
  "instrucoes": ["...", "..."],
  "pistas": ["costas direitas", "não forçar o joelho"],
  "evitar_se": ["dor lombar aguda"]
}

// rotinas.json
{
  "id": "manha-10",
  "nome": "Manhã, 10 minutos",
  "descanso_s": 5,
  "passos": [
    { "exercicio": "isquiotibiais-sentado" },
    { "exercicio": "gemeos-parede", "duracao_s": 20 }   // sobrepõe o valor por omissão
  ]
}

// histórico (localStorage, chave "exercicios.historico.v1")
{ "rotina": "manha-10", "inicio": "2026-09-11T07:02:00Z", "duracao_s": 612, "completa": true }
```

## 5. Fases

### v0, MVP (uma sessão de trabalho)
Objectivo: usar amanhã de manhã.
- Catálogo com 10 a 12 alongamentos: isquiotibiais, quadríceps, gémeos, flexores da anca, glúteos/piriforme, peitoral, dorsal, trapézio/pescoço, lombar (joelhos ao peito), rotação torácica, tornozelos, punhos.
- Duas rotinas: "Manhã, 10 min" e "Pós-treino, 8 min".
- Reprodutor: passo actual em letras grandes, contagem decrescente, botões pausa / anterior / seguinte, lado E/D automático, descanso entre passos.
- Voz e vibração no fim de cada passo.
- Wake Lock.
- Registo da sessão no histórico ao terminar.
- Funciona aberto directamente do ficheiro (`file://`), sem service worker.

### v1, uso diário
- Editor de rotinas (escolher exercícios, ordem, duração) guardado em localStorage.
- Ecrã de histórico: lista, sequência de dias seguidos, total semanal.
- Definições: descanso por omissão, voz on/off, contagem final falada, tema escuro.
- Exportar e importar JSON (histórico + rotinas personalizadas).
- `manifest.webmanifest` + `sw.js` + publicação em GitHub Pages para instalar no telemóvel.

### v2, outros tipos de exercício
- `tipo: "repeticoes"` com séries, repetições e descanso.
- Categorias força e mobilidade, com UI de registo de carga.
- Progressão simples (aumentar duração ou repetições quando a rotina é cumprida N vezes).
- Lembretes via Notification API (só funciona com a PWA instalada).

## 6. O que fica explicitamente de fora
- Contas, sincronização, backend. É uma aplicação de uma pessoa.
- Ilustrações ou vídeo. Só se se provar que o texto não chega.
- Frameworks e bundlers.
- Integração com relógios ou apps de saúde.

## 7. Critério de sucesso da v0
Conseguir fazer a rotina "Manhã, 10 min" no telemóvel, no chão, sem tocar no ecrã do início ao fim, e ver a sessão no histórico.

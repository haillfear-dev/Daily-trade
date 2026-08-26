# Daily Trade

## O que é

**Daily Trade v0.1** é a fundação de uma extensão Chrome Manifest V3 que atua como copiloto de análise para operações curtas. Ela transforma candles em um modelo interno, calcula indicadores no dispositivo, ranqueia setups e mantém um diário local. **Não executa ordens, não clica em ACIMA/ABAIXO, não coleta credenciais e não promete resultados.** Toda decisão e execução continuam com o usuário.

Nesta versão, o painel usa três cenários reproduzíveis do modo Demo. A captura real da IQ Option **não é declarada como funcional**: sem uma sessão autenticada e tráfego real disponível no ambiente de desenvolvimento, não foi possível validar formatos, eventos ou estabilidade dos WebSockets da plataforma. O content script atual é apenas uma ponte passiva e não monkey-patches `WebSocket`, `fetch` ou XHR.

## Arquitetura

```text
public/manifest.json             Manifest V3, permissões mínimas e side panel
src/background.ts                service worker e abertura do painel pela action
src/content.ts                   detecção passiva da página, sem automação
src/models.ts                    modelo canônico desacoplado da corretora
src/adapters/market.ts           contrato MarketDataAdapter, Demo e placeholder IQ Option
src/fixtures/scenarios.json      100 candles M5 por ativo/cenário
src/analysis/                    indicadores, estruturas, scoring e expiração
src/providers.ts                 IA desativada e diário local/placeholder Sheets
src/main.tsx                     dashboard React, ranking e fluxo do diário
```

O fluxo é `MarketDataAdapter → MarketSnapshot → análise técnica local → AssetAnalysis → painel`. Esse limite impede que formatos privados da IQ Option contaminem indicadores e UI. `AIAnalysisProvider` existe apenas como contrato; `DisabledAIProvider` confirma que a v0.1 não depende de IA. Chaves OpenAI nunca devem usar variáveis `VITE_*`: uma integração futura deve ficar num backend.

## Como instalar e rodar

Requer Node.js 20 ou superior.

```bash
npm install
npm run dev       # painel no navegador para desenvolvimento visual
npm run test
npm run lint
npm run build
```

### Como carregar a extensão no Chrome

1. Execute `npm run build`.
2. Abra `chrome://extensions`.
3. Ative **Developer mode / Modo do desenvolvedor**.
4. Clique em **Load unpacked / Carregar sem compactação**.
5. Selecione a pasta `dist/` (não a raiz do repositório).
6. Abra uma página e clique no ícone da extensão para exibir o side panel.

O build copia o manifesto e gera `background.js`, `content.js` e a aplicação do painel dentro de `dist/`.

## Como funciona o modo Demo

`DemoMarketDataAdapter` carrega 100 candles M5 para AUD/USD (forte baixa com pullback), EUR/USD (alta com correção) e GBP/USD (lateral). O ranking é ordenado pela qualidade relativa do setup. Use ↻ para recalcular; nenhuma cotação é real. O card mostra preço, zonas, tendência, RSI, pullback e expiração simulada próxima de cinco minutos.

O botão **REGISTRAR ENTRADA** só fica disponível para um viés direcional. Ele sugere o valor padrão de R$ 6,00, persiste ativo, direção, preço, horário, timeframe e expiração em `chrome.storage.local`; depois o usuário marca WIN, LOSS ou EMPATE manualmente.

## Como funciona a análise

- EMA 9, 20 e 50, RSI 14 e Bollinger 20/2 são calculados localmente.
- Tendência combina alinhamento das médias e momentum recente.
- Suportes/resistências são zonas agrupadas a partir de pivôs; `strength` é uma heurística de 0–100, não probabilidade.
- Price action reconhece doji, martelo, shooting star, engolfos, força, indecisão e pavios como contexto, nunca como certeza direcional.
- Pullback distingue impulso, início de correção e aproximação de zona.
- Um candle muito maior que a média ativa a regra **não perseguir movimento**, reduz nota e força ESPERAR.
- Estrelas medem qualidade relativa: não são probabilidade matemática nem recomendação financeira.

A análise completa ocorre ao carregar ou atualizar manualmente no Demo. A arquitetura permite no futuro dispará-la em fechamento de candle, aproximação de zona, rompimento ou rejeição, sem chamar IA a cada tick.

## Debug e investigação da IQ Option

O painel Debug informa ativo/preço, quantidade de candles, fonte, WebSocket identificado, mensagens reconhecidas e última atualização. O adapter `IQOptionMarketDataAdapter` retorna vazio deliberadamente até existir captura validada. A próxima investigação deve ser feita numa sessão autorizada via DevTools (Network → WS, Fetch/XHR), documentando envelopes de mensagem e mapeamentos sem armazenar tokens. Depois, um observador passivo pode normalizar mensagens reconhecidas para `MarketSnapshot`, sempre com fallback seguro e sem interferir na página.

## Limitações

- Somente fixtures; sem cotação, WebSocket, ativos OTC ou expirações reais da IQ Option.
- Zonas, padrões e scoring são heurísticas iniciais que precisam de calibração e backtest.
- Atualização e expiração são simuladas; não há sincronização entre abas.
- Diário está apenas no perfil local do Chrome e o lucro de WIN usa payout demonstrativo de 80%.
- Google Sheets e OpenAI são contratos/placeholders, sem credenciais ou chamadas externas.
- Não há OCR, screenshots, execução automática ou interação com botões da corretora.

## Roadmap

### V0.1
- extensão Chrome, painel e modo demo;
- indicadores, price action, suporte/resistência e ranking;
- diário local.

### V0.2
- integração real validada com IQ Option e captura WebSocket passiva;
- múltiplos ativos e expiração obtida da plataforma.

### V0.3
- backend, OpenAI API e ranking contextual com IA.

### V0.4
- Google Sheets, diário sincronizado e métricas por ativo/setup.

### V0.5
- taxa de acerto por estrelas, ativo, direção e horário;
- setup mais eficiente e expectativa matemática.

## Segurança e contribuição

Nunca adicione `.env`, chaves de API, senhas, tokens de sessão ou dados pessoais ao repositório. Rode `npm run lint`, `npm run test` e `npm run build` antes de enviar mudanças. O produto é uma ferramenta educacional de apoio, não um robô ou consultoria financeira.

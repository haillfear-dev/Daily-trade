# Diagnóstico passivo de fontes de mercado

O modo de diagnóstico é opt-in e serve somente para descobrir quais fontes da página da IQ Option podem transportar dados de mercado. Ele não alimenta a análise técnica, não cria conexões, não chama `WebSocket.send`, não envia mensagens para workers e não altera payloads.

## Por que existe um script no contexto MAIN

Content scripts do Chrome executam em um mundo JavaScript isolado. Substituir `window.WebSocket`, `Worker` ou `SharedWorker` nesse mundo não observa os objetos criados pelo código da página. Por isso, `diagnostics-main.js` é carregado no contexto `MAIN` no início do documento e instala proxies transparentes dos construtores. Os proxies apenas chamam os construtores originais e adicionam listeners passivos a mensagens recebidas. A ponte para o content script usa `window.postMessage` e transporta exclusivamente metadados já sanitizados.

## Dados coletados

- fonte (`websocket`, `worker` ou `shared-worker`) e direção (`created` ou `received`);
- origem da URL (protocolo e host, sem caminho, query, fragmento ou credenciais) e host, quando disponíveis;
- timestamp, tipo e tamanho do payload;
- classificações baseadas em nomes de campos de mercado;
- amostra de até 180 caracteres somente para texto candidato, removendo campos sensíveis, e-mails, tokens Bearer e JWTs.

Payloads binários nunca são decodificados ou amostrados. Cookies, headers e armazenamento da página não são acessados.

## Limitações

- Fontes e mensagens anteriores à ativação podem não aparecer.
- O diagnóstico observa apenas mensagens entregues ao objeto visível na página. Tráfego exclusivamente interno de um worker não é acessível.
- Protocolos binários são registrados somente por tipo e tamanho; portanto, um feed binário não será classificado como candidato automaticamente.
- A instrumentação depende de construtores globais e pode não alcançar implementações capturadas antes do script, iframes fora do escopo ou mecanismos nativos/WebAssembly internos.
- A classificação por nomes de campos é heurística e não confirma que um evento seja um tick ou candle.
- O buffer guarda no máximo os 100 eventos mais recentes por aba durante a sessão do navegador.

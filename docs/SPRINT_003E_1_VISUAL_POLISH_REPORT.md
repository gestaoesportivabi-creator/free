# SPRINT 003E.1 VISUAL POLISH REPORT

Projeto: `SCOUT 21 PRO`  
Repositorio: `free`  
Branch: `feature/cronometro-partida`  
Data: `2026-07-17`

## Objetivo

Executar o polish final da coleta realtime sem alterar regras de negocio, persistencia, cronometro ou backend.

## Ajustes aplicados

- padronizacao de copy para `Atleta`, `Eventos da partida`, `Eventos recentes` e `Salvar como incompleta`;
- reforco da hierarquia do encerramento, com `Finalizar coleta` destacado apenas depois do estado `ENCERRADO`;
- substituicao da confirmacao nativa de `Encerrar partida` por modal interno com acoes claras;
- simplificacao do bloco de atletas em quadra para tres instrucoes curtas;
- correcao do rodape de eventos recentes para usar horario absoluto e evitar duplicacoes de texto.

## Decisoes de UX

- o cronometro continua como foco principal do painel central;
- `Encerrar partida` recebe destaque proprio no segundo tempo;
- `Salvar como incompleta` permanece secundaria para nao competir com a acao principal;
- o rodape passa a resumir cada evento em uma linha legivel: `hora · atleta · evento`.

## Timestamp do gol

O rodape de eventos recentes passou a usar `storedToAbsoluteSeconds(period, time)` para refletir o mesmo horario absoluto exibido no log e na reabertura.

Impacto esperado:
- gol no segundo tempo aparece com o mesmo horario no cronometro, no log e no resumo recente;
- duplicacoes como `Gol Gol` e `Bloqueio Bloqueio` deixam de aparecer no rodape.

## Cobertura E2E prevista nesta sprint

- validar o novo rotulo `Salvar como incompleta`;
- validar abertura, cancelamento e confirmacao do modal `Encerrar partida`;
- validar que o gol aparece como `22:40` no log e nos eventos recentes;
- validar que o resumo recente nao duplica a acao.

## Responsividade revisada

Pontos alvo desta rodada:
- cabecalho da coleta;
- bloco de atletas em quadra;
- botoes de encerramento;
- rodape de eventos recentes;
- modal interno de encerramento.

## Riscos residuais

- ainda existem outros `window.confirm` fora do escopo desta sprint, como fechamento da janela e retorno ao primeiro tempo;
- a tela continua grande e sensivel a pequenos ajustes de espaco em viewports menores;
- o build do frontend continua regenerando artefatos como `public/sitemap.xml` e `dist/index.html`.

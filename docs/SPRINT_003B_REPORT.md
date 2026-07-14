# SPRINT 003B REPORT

Projeto: SCOUT 21 PRO  
Repositorio: `free`  
Branch: `feature/cronometro-partida`  
Upstream: nao configurado no momento da execucao

## Resumo funcional

A Sprint 003B conectou a experiencia operacional do cronometro ao fluxo ativo de coleta em `MatchScoutingWindow`, reutilizando exclusivamente `ClockService` como fonte canonica de tempo.

Status de QA complementar:
- ver `docs/SPRINT_003B_1_QA_REPORT.md`;
- resultado atual: `BLOQUEADA PARA VALIDACAO OPERACIONAL`.

O resultado pratico desta Sprint:
- o fluxo realtime agora consome `useMatchClock` como adaptador de interface;
- o painel central do cronometro passa a exibir periodo, tempo oficial, estado visivel e acao principal por estado;
- a sincronizacao manual foi adicionada com restauracao do estado anterior valido;
- eventos validados passaram a consultar uma matriz tipada fora do servico;
- pausas por evento ganham retomada destacada via `CONTINUAR PARTIDA`;
- transicoes invalidas de periodo e bloqueios de registro em estados proibidos ficam centralizados no fluxo da tela.

## Arquivos criados

- `21Scoutpro/hooks/useMatchClock.ts`
- `21Scoutpro/utils/matchClockEventRules.ts`
- `docs/SPRINT_003B_REPORT.md`

## Arquivos modificados

- `21Scoutpro/components/MatchScoutingWindow.tsx`
- `21Scoutpro/services/clockService.ts`

Observacao:
- `21Scoutpro/public/sitemap.xml` e `21Scoutpro/dist/index.html` ficaram alterados por comandos de build locais.

## Arquitetura do adaptador

```text
MatchScoutingWindow
  -> useMatchClock
    -> ClockService
      -> clockSnapshot

MatchScoutingWindow
  -> getMatchClockEventRule()
  -> decide pausa antes/depois do evento
  -> chama comandos expostos por useMatchClock
  -> continua montando MatchEvent[] e MatchRecord sem alterar payload
```

### Responsabilidades de `useMatchClock`

- encapsular a instancia de `ClockService`;
- expor `snapshot` unico para a interface;
- manter o tick do relogio em realtime;
- controlar pausa manual, pausa por evento, intervalo, encerramento e sincronizacao;
- preservar o estado anterior ao entrar em `SINCRONIZANDO`;
- restaurar rodando/pausado conforme o snapshot salvo.

### Responsabilidades de `matchClockEventRules`

- centralizar a matriz tipada de pausa;
- manter `ClockService` sem acoplamento ao catalogo esportivo;
- documentar quais eventos estao validados e quais seguem pendentes.

## Estados visuais entregues

- `PRE_JOGO`
- `PRIMEIRO TEMPO`
- `PAUSADO`
- `SINCRONIZANDO`
- `INTERVALO`
- `SEGUNDO TEMPO`
- `ENCERRADO`

Cada estado deriva de `clockSnapshot.state`.

## Diagrama textual do fluxo do cronometro

```text
PRE_JOGO
  -> INICIAR PARTIDA
  -> PRIMEIRO_TEMPO rodando

PRIMEIRO_TEMPO rodando
  -> PAUSAR
  -> PAUSADO
  -> evento validado com pausa
    -> registra evento
    -> PAUSADO por evento
    -> CONTINUAR PARTIDA

PRIMEIRO_TEMPO pausado
  -> CONTINUAR PARTIDA
  -> PRIMEIRO_TEMPO rodando
  -> ENCERRAR TEMPO / ENCERRAR COLETA 1T
  -> INTERVALO

INTERVALO
  -> INICIAR SEGUNDO TEMPO
  -> SEGUNDO_TEMPO rodando

SEGUNDO_TEMPO rodando
  -> PAUSAR
  -> PAUSADO
  -> ENCERRAR TEMPO
  -> ENCERRADO

ENCERRADO
  -> bloqueia novos eventos no fluxo ativo
  -> manter save/edicao ja existentes
```

## Diagrama textual da sincronizacao

```text
estado atual valido
  -> abrir "Sincronizar cronometro"
  -> salvar snapshot anterior
  -> entrar em SINCRONIZANDO
  -> operador informa minuto e segundo
  -> validar periodo / inteiro / 0..59 / sem negativo
  -> confirmar
    -> sync no ClockService
    -> restaurar estado anterior rodando ou pausado

cancelar
  -> restaurar snapshot anterior
  -> nao alterar o tempo
```

## Eventos configurados para pausar

Validados:
- `goal`
- `foul`
- `shot` quando `result === 'outside'`

Comportamento aplicado:
- `goal`: pausa manual antes do fluxo e pausa por evento apos registrar;
- `foul`: pausa manual antes do fluxo e pausa por evento apos registrar;
- `shot:outside`: pausa por evento apos registrar.

## Eventos configurados para nao pausar

Validados:
- `pass`
- `shot:inside`
- `shot:post`
- `shot:blocked`
- `card`
- `tackle`
- `save`

## Regras pendentes de validacao

Mantidas com `preserve-current`:
- `block`
- `corner`
- `freeKick`
- `penalty`
- `lateral`

Observacao:
- nesses casos a decisao definitiva nao foi silenciosamente inventada;
- o fluxo preserva o comportamento operacional legado onde ele ja existia.

## Decisoes de UX

- o painel central agora comunica estado com texto, nao apenas com cor;
- a acao principal muda conforme o estado do relogio;
- a retomada apos pausa por evento fica destacada no mesmo painel;
- a sincronizacao virou acao secundaria visivel e constante;
- o bloqueio de eventos em `PRE_JOGO`, `INTERVALO`, `SINCRONIZANDO`, `PAUSADO` e `ENCERRADO` gera orientacao curta via mensagem de topo;
- o periodo visivel (`1T` ou `2T`) continua explicito durante toda a coleta.

## Validacoes manuais realizadas

Validado no ambiente local:
- backend health check `http://localhost:3000/health`: aprovado
- frontend local `http://localhost:5173`: respondendo
- `backend type-check`: aprovado
- `frontend build` (`21Scoutpro`): aprovado
- `frontend type-check` filtrado para `MatchScoutingWindow.tsx`: sem erros novos

Validado por implementacao e inspeção controlada do fluxo:
- estados principais do painel foram mapeados a partir de `clockSnapshot`;
- sincronizacao restaura snapshot anterior e mantem estado rodando/pausado;
- `getEventStamp()` segue como origem oficial dos timestamps do fluxo ativo;
- regra tipada de pausa foi extraida para modulo proprio;
- bloqueios de evento por estado foram centralizados.

Nao validado ponta a ponta nesta execucao:
- rodada autenticada completa em partida QA no browser;
- persistencia final reabrindo uma partida apos salvar via UI;
- evidencias visuais dos cenarios operacionais completos da especificacao.

Motivo atualizado:
- a Sprint 003B.1 confirmou o bloqueio operacional por ausencia de credencial/partida de QA autorizadas;
- o detalhe do bloqueio e das correcoes posteriores esta em `docs/SPRINT_003B_1_QA_REPORT.md`.

## Evidencias dos cenarios

Cobertos tecnicamente:
- Cenario 1: estados `PRE_JOGO` e `PRIMEIRO_TEMPO` conectados ao painel e ao comando principal
- Cenario 2: pausa manual e retomada via `PAUSADO -> CONTINUAR PARTIDA`
- Cenario 4: pausa por evento com CTA central `CONTINUAR PARTIDA`
- Cenarios 5, 6 e 7: sincronizacao com confirmacao, cancelamento e restauracao do estado anterior
- Cenarios 9, 10 e 11: protecoes de `INTERVALO`, `SEGUNDO_TEMPO` e `ENCERRADO`

Cobertos por build/type-check:
- compatibilidade de compilacao do frontend alterado
- compatibilidade do backend sem alteracoes

Pendentes de rodada QA assistida:
- evidencias navegaveis dos cenarios com clique real na coleta
- confirmacao visual de autosave durante partida autenticada
- confirmacao visual de recarga de partida salva

## Resultado do build

- `backend type-check`: aprovado
- `frontend build` (`21Scoutpro`): aprovado com warnings de env/chunks
- `build` monorepo completo: bloqueado quando executado com backend dev ativo, por lock do Prisma em `query_engine-windows.dll.node`

## Resultado do frontend type-check

- o type-check completo do frontend continua reprovado por erros preexistentes em varios arquivos fora do escopo;
- o filtro para `components/MatchScoutingWindow.tsx` nao retornou erros novos apos a Sprint.

## Resultado do lint

- nao foi executado lint frontend dedicado nesta Sprint;
- o escopo permaneceu em build e type-check.

## Erros preexistentes separados dos erros da Sprint

Preexistentes fora do escopo:
- erros em `App.tsx`
- erros em componentes administrativos e dashboards
- erros em `Schedule`, `ScoutTable`, `TimeControl`, `services/api.ts`, `config.ts` e modulos de blog

Erros novos da Sprint:
- nenhum erro residual encontrado em `21Scoutpro/components/MatchScoutingWindow.tsx`
- nenhum erro residual encontrado em `21Scoutpro/hooks/useMatchClock.ts`
- nenhum erro residual encontrado em `21Scoutpro/utils/matchClockEventRules.ts`
- nenhum erro residual encontrado em `21Scoutpro/services/clockService.ts`

## Riscos remanescentes

- `MatchScoutingWindow` continua grande e concentrando muita orquestracao de UI;
- eventos pendentes (`block`, `corner`, `freeKick`, `penalty`, `lateral`) ainda precisam validacao da comissao;
- o build do monorepo completo pode falhar localmente se o backend estiver segurando o binario do Prisma;
- os warnings antigos de chunk grande continuam no frontend.
- validacao autenticada continua pendente ate existir massa de QA autorizada.

## Limitacoes

- nenhuma alteracao de backend, banco, schema, migration ou seed;
- nenhuma persistencia nova do estado detalhado do cronometro;
- nenhuma sincronizacao com servidor ou entre dispositivos;
- nenhuma extensao para prorrogacao, disputa por penaltis ou cronometro regressivo;
- nenhuma ativacao de `RealtimeScoutPage`;
- nenhuma refatoracao ampla de `MatchScoutingWindow`.

## Backlog recomendado para a Sprint 003C de QA automatizado

- criar testes unitarios para `useMatchClock`
- criar testes unitarios para `matchClockEventRules`
- criar testes de transicao do painel por estado do `clockSnapshot`
- automatizar cenarios de pausa por evento e sincronizacao
- cobrir persistencia e reabertura da coleta
- automatizar smoke test autenticado do fluxo realtime
- decidir regra definitiva dos eventos ainda pendentes

## Escopo preservado

- backend inalterado
- banco inalterado
- payload atual preservado
- autosave mantido
- `ClockService` continua independente de regras esportivas
- nenhuma funcionalidade fora do escopo da Sprint foi adicionada

## Correcoes posteriores registradas na Sprint 003B.1

- correcao do retorno ao primeiro tempo no fluxo realtime;
- remocao de chamada duplicada ao retornar ao primeiro tempo no postmatch;
- preservacao do estado `PRE_JOGO` na persistencia sem kickoff;
- bloqueio da abertura do modal de sincronizacao quando o servico rejeita a transicao.

## Conclusao real da Sprint

- implementacao tecnica: pronta para revisao humana;
- validacao operacional autenticada: bloqueada ate definicao de conta, tenant e partida de QA;
- proxima acao segura: executar a rodada 003B.1 com massa autorizada e entao liberar a Sprint 003C.

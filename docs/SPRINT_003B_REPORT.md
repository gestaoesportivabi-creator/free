# SPRINT 003B REPORT

Projeto: SCOUT 21 PRO  
Repositorio: `free`  
Branch: `feature/cronometro-partida`  
Upstream: nao configurado no momento da execucao

## Resumo funcional

A Sprint 003B conectou a experiencia operacional do cronometro ao fluxo ativo de coleta em `MatchScoutingWindow`, reutilizando exclusivamente `ClockService` como fonte canonica de tempo.

Status de QA complementar:
- ver `docs/SPRINT_003B_1_QA_REPORT.md`;
- resultado atual: `AMBIENTE QA OFICIAL CRIADO E VALIDADO COM RESSALVAS`.

O resultado pratico desta Sprint:
- o fluxo realtime agora consome `useMatchClock` como adaptador de interface;
- o painel central do cronometro passa a exibir periodo, tempo oficial, estado visivel e acao principal por estado;
- a sincronizacao manual foi adicionada com restauracao do estado anterior valido;
- eventos validados passaram a consultar uma matriz tipada fora do servico;
- pausas por evento ganham retomada destacada via `CONTINUAR PARTIDA`;
- transicoes invalidas de periodo e bloqueios de registro em estados proibidos ficam centralizados no fluxo da tela.

## Arquivos criados na Sprint 003B

- `21Scoutpro/hooks/useMatchClock.ts`
- `21Scoutpro/utils/matchClockEventRules.ts`

## Arquivos modificados na Sprint 003B

- `21Scoutpro/components/MatchScoutingWindow.tsx`
- `21Scoutpro/services/clockService.ts`

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

Validado por rodada autenticada QA:
- login com usuario QA criado por seed oficial;
- visualizacao do tenant `QA SCOUT 21`;
- abertura da partida `QA CRONOMETRO 003B`;
- abertura do fluxo `Adicionar dados da Partida`;
- registro de um gol QA;
- salvamento como incompleto;
- reabertura pela tela de analise e por `Editar Dados`.

Principal ressalva:
- o cronometro fica visivel na coleta, mas o fluxo de gol ainda abriu a etapa manual `Tempo do gol`, exigindo digitacao de `00:15`.

## Atualizacao da infraestrutura QA

Arquivos adicionados nesta rodada:
- `backend/scripts/helpers/qa-environment.ts`
- `backend/scripts/seed-qa-environment.ts`
- `backend/scripts/cleanup-qa-environment.ts`
- `docs/QA_GUIDE.md`

Arquivos atualizados nesta rodada:
- `backend/package.json`
- `docs/SPRINT_003B_1_QA_REPORT.md`
- `docs/SPRINT_003B_REPORT.md`

Objetivo atendido:
- a Sprint 003B agora possui uma massa oficial e reversivel para a validacao do cronometro.

## Resultado do build

- `backend type-check`: aprovado
- `frontend build` (`21Scoutpro`): aprovado com warnings antigos de env/chunks

## Riscos remanescentes

- `MatchScoutingWindow` continua grande e concentrando muita orquestracao de UI;
- eventos pendentes (`block`, `corner`, `freeKick`, `penalty`, `lateral`) ainda precisam validacao da comissao;
- o frontend ainda emite warnings antigos de chunk grande;
- o fluxo `Ativos` ainda depende de descoberta manual do operador;
- a semantica final do timestamp do evento precisa confirmacao funcional.

## Limitacoes

- sem migrations ou alteracao de schema;
- nenhuma persistencia nova do estado detalhado do cronometro;
- nenhuma sincronizacao com servidor ou entre dispositivos;
- nenhuma extensao para prorrogacao, disputa por penaltis ou cronometro regressivo;
- nenhuma ativacao de `RealtimeScoutPage`;
- nenhuma refatoracao ampla de `MatchScoutingWindow`.

## Backlog recomendado para a Sprint 003C

- automatizar login QA e abertura da partida oficial;
- automatizar o fluxo `Ativos -> jogador -> evento -> salvar`;
- validar se o timestamp do evento deve ser automatico ou manual por regra de produto;
- cobrir reabertura da coleta com ultimo comando reidratado;
- adicionar smoke test para cleanup em `dry-run`;
- testar navegacao de saida da coleta com alteracoes em andamento.

## Conclusao real da Sprint

- implementacao tecnica do cronometro: pronta para validacao automatizada;
- validacao operacional autenticada: executada com sucesso na massa QA oficial;
- proxima acao segura: seguir para a Sprint 003C automatizando os cenarios validados e cobrindo as ressalvas operacionais mapeadas.

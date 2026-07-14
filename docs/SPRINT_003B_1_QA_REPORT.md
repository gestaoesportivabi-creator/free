# SPRINT 003B.1 QA REPORT

Projeto: SCOUT 21 PRO  
Repositorio: `free`  
Branch: `feature/cronometro-partida`  
Status final: `BLOQUEADA PARA VALIDACAO OPERACIONAL`

## Ambiente

- Data: `2026-07-14`
- Responsavel: Codex
- Frontend local: `http://localhost:5173`
- Backend local: `http://localhost:3000`
- Banco: online, acessado pelo backend local
- Upstream da branch: nao configurado

## Massa de QA

- Conta autorizada de QA: nao confirmada
- Tenant de QA autorizado: nao identificado
- Partida de QA autorizada: nao identificada
- Atletas ficticios/autorizados: nao identificados
- Procedimento de limpeza dos dados: nao informado
- Responsavel pela autorizacao: nao informado

## Evidencia do bloqueio operacional

- O frontend local abriu normalmente na tela de login.
- O backend local respondeu com sucesso no health check.
- Foi tentado apenas o login com a credencial de teste documentada no repositorio.
- Resultado obtido na interface: `Credenciais invalidas`.

Observacao:
- sem credencial de QA validada e sem partida autorizada, a Sprint nao pode ser marcada como concluida;
- nao houve tentativa de criar usuario, seed, migration, bypass de autenticacao ou uso de partida real.

## Pre-requisitos faltantes

1. Usuario de QA autorizado, com credencial valida no ambiente conectado ao banco online.
2. Tenant/clube de QA explicitamente autorizado para a rodada.
3. Partida ficticia ou autorizada para teste da coleta.
4. Confirmacao de quais atletas podem aparecer nos registros.
5. Procedimento de remocao ou descarte dos dados gerados.

## Revisao do diff da Sprint 003B

Arquivos revisados:
- `21Scoutpro/components/MatchScoutingWindow.tsx`
- `21Scoutpro/hooks/useMatchClock.ts`
- `21Scoutpro/services/clockService.ts`
- `21Scoutpro/utils/matchClockEventRules.ts`
- `docs/SPRINT_003B_REPORT.md`

Conclusoes da revisao:
- o tick do cronometro ficou centralizado em `useMatchClock`;
- nao encontrei `setInterval` adicional de relogio fora do adaptador;
- o autosave continua baseado em debounce/intervalo proprio da tela, nao no tick por segundo;
- `getEventStamp` segue centralizado no caminho oficial do cronometro;
- ainda existem `pauseClock()` diretos em penalty/freeKick por heranca do fluxo legado, mas sem contradizer a matriz tipada atual;
- havia defeitos objetivos em transicoes e persistencia, corrigidos nesta Sprint 003B.1.

## Bugs encontrados

### CLK-001

- Severidade: `P1`
- Titulo: retorno ao primeiro tempo nao alterava o cronometro no fluxo realtime
- Reproducao:
  1. Estar no segundo tempo.
  2. Acionar `Voltar ao 1o tempo`.
  3. Confirmar a acao.
- Causa:
  - o caminho realtime nao chamava `retornarAoPrimeiroTempo()`;
  - o caminho postmatch chamava `retornarAoPrimeiroTempo()` duas vezes.
- Correcao:
  - unificacao da transicao em um unico caminho;
  - remocao da chamada duplicada;
  - bloqueio de save quando a transicao falha.
- Reteste:
  - type-check filtrado dos arquivos alterados: aprovado;
  - build do frontend: aprovado.

### CLK-002

- Severidade: `P1`
- Titulo: estado de pre-jogo podia ser salvo como primeiro tempo antes do apito inicial
- Reproducao:
  1. Confirmar escalação no realtime.
  2. Deixar a tela autosalvar antes de iniciar o cronometro.
  3. Reabrir a coleta.
- Causa:
  - `collectionPhase` dependia de `isMatchStarted`, que representa escalação confirmada e nao kickoff;
  - na reidratacao sem eventos o cronometro era levado para `PRIMEIRO_TEMPO`.
- Correcao:
  - `collectionPhase` passou a respeitar `clockSnapshot.state`;
  - reidratacao sem eventos e sem progresso de posse volta para `PRE_JOGO`.
- Reteste:
  - type-check filtrado dos arquivos alterados: aprovado;
  - build do frontend: aprovado.

### CLK-003

- Severidade: `P2`
- Titulo: modal de sincronizacao podia abrir mesmo quando `iniciarSincronizacao()` falhava
- Reproducao:
  1. Tentar abrir sincronizacao em estado rejeitado pelo servico.
  2. Observar que a UI ainda seguia para o modal.
- Causa:
  - ausencia de `return` apos erro em `openClockSyncModal`.
- Correcao:
  - a funcao agora interrompe o fluxo ao receber erro do adaptador.
- Reteste:
  - type-check filtrado dos arquivos alterados: aprovado;
  - build do frontend: aprovado.

## Cenarios da especificacao

### Cenarios bloqueados

- Cenario 01: bloqueado em autenticacao.
- Cenario 02: bloqueado por ausencia de acesso autenticado a uma partida de QA.
- Cenario 03: bloqueado por ausencia de acesso autenticado a uma partida de QA.
- Cenario 04: bloqueado por ausencia de acesso autenticado a uma partida de QA.
- Cenario 05: bloqueado por ausencia de acesso autenticado a uma partida de QA.
- Cenario 06: bloqueado por ausencia de acesso autenticado a uma partida de QA.
- Cenario 07: bloqueado por ausencia de acesso autenticado a uma partida de QA.
- Cenario 08: bloqueado por ausencia de acesso autenticado a uma partida de QA.
- Cenario 09: bloqueado por ausencia de acesso autenticado a uma partida de QA.
- Cenario 10: bloqueado por ausencia de acesso autenticado a uma partida de QA.
- Cenario 11: bloqueado por ausencia de acesso autenticado a uma partida de QA.
- Cenario 12: bloqueado por ausencia de acesso autenticado a uma partida de QA.
- Cenario 13: bloqueado por ausencia de acesso autenticado a uma partida de QA.
- Cenario 14: bloqueado por ausencia de acesso autenticado a uma partida de QA.
- Cenario 15: bloqueado por ausencia de acesso autenticado a uma partida de QA.
- Cenario 16: bloqueado por ausencia de acesso autenticado a uma partida de QA.
- Cenario 17: bloqueado por ausencia de acesso autenticado a uma partida de QA.
- Cenario 18: bloqueado por ausencia de acesso autenticado a uma partida de QA.

### Validacoes tecnicas executadas

- `git diff --check`: aprovado
- `git log --oneline -10`: aprovado para os commits de referencia da especificacao
- `git branch -vv`: confirmado sem upstream
- `backend type-check`: aprovado
- `backend health check`: aprovado
- `frontend build`: aprovado fora do sandbox, com warnings antigos de env/chunk
- `frontend type-check` filtrado para os arquivos alterados: sem erros novos

## Riscos e limitacoes

- a validacao operacional ponta a ponta continua pendente;
- nao houve confirmacao de autosave real em Network autenticado;
- nao houve confirmacao de persistencia/reabertura via UI autenticada;
- registros antigos com `collectionPhase = 1` e sem eventos continuam semanticamente ambiguos sem um marcador explicito de kickoff persistido.

## Duvida tecnica

- se a operacao considerar indispensavel diferenciar de forma absoluta "escalação confirmada" de "partida iniciada" mesmo sem eventos, sera preciso persistir um marcador explicito de kickoff no payload ou no backend. Isso nao foi introduzido nesta Sprint por estar fora do escopo.

## Decisao final

- Aprovacao operacional: `REPROVADA POR BLOQUEIO`
- Liberacao para Sprint 003C: `NAO`

Condicao para liberar:
- repetir a rodada autenticada completa com conta, tenant e partida de QA explicitamente autorizados;
- reexecutar os 18 cenarios com evidencia de UI, console e Network.

# HOTFIX 003H - Restauracao do Cronometro em Partidas Incompletas

## Causa raiz

O bug tinha duas causas combinadas:

- o save incompleto nao persistia o snapshot temporal do relogio;
- na reabertura, `useMatchClock` recriava o `ClockService` no mount mesmo sem troca real de modo e sobrescrevia a hidratacao restaurada.

Na pratica, `MatchScoutingWindow` restaurava placar, eventos, lineup e periodo a partir do payload salvo, mas sem uma fonte temporal persistida. Quando o snapshot passou a ser restaurado, ainda havia um reset posterior do `ClockService` que empurrava o estado de volta para `PRE_JOGO 00:00`.

O fluxo efetivo era:

`ClockService -> useMatchClock -> MatchScoutingWindow.buildMatchSnapshot() -> lineup JSON -> backend -> MatchScoutingWindow hydration`

Havia restauracao de contexto esportivo, mas nao existia persistencia explicita do snapshot temporal e o hook do relogio ainda sobrescrevia a hidratacao inicial.

## Contrato temporal

Campos considerados no hotfix:

| Campo | Origem | Persiste | Observacao |
| --- | --- | --- | --- |
| `currentTimeSeconds` | `ClockService` | sim | fonte principal do tempo exibido |
| `period` | `ClockService` | sim | `1T` ou `2T` |
| `state` | `ClockService` | sim | reabre sempre pausado quando houver snapshot |
| `isRunning` | `ClockService` | sim | persistido como `false` no snapshot salvo |
| `firstHalfLocked` | `ClockService` | sim | preserva a transicao para `2T` |
| `collectionPhase` | `MatchScoutingWindow` | ja persistia | continua sendo usado como apoio |
| `postMatchEventLog` | pipeline existente | ja persistia | continua sendo a fonte dos eventos |

Implementacao minima:

- nenhum endpoint novo;
- nenhum campo novo de banco;
- nenhum modelo paralelo;
- snapshot salvo dentro de `lineup.clockSnapshot`.

## Antes

- save incompleto preservava eventos, placar e periodo;
- reopen restaurava o periodo;
- reopen zerava o relogio para `00:00`;
- partidas antigas sem snapshot pareciam validas mesmo sem tempo confiavel.

## Depois

- save incompleto persiste snapshot temporal em `lineup.clockSnapshot`;
- reopen restaura tempo, periodo e estado do relogio;
- `useMatchClock` so recria o `ClockService` quando o `mode` realmente muda;
- partidas incompletas reabrem em `PAUSADO`;
- o operador pode continuar a coleta sem perder timestamps;
- compatibilidade antiga entra em fallback seguro.

## Fallback de compatibilidade

Se a partida antiga nao tiver `clockSnapshot`, o sistema:

- nao inventa horario;
- reabre em `PAUSADO`;
- informa que e necessario sincronizar o relogio;
- exige sincronizacao antes de retomar a partida ou registrar novos eventos realtime.

## Protecoes

- hidratacao continua guardada por `hydrationAppliedForMatchIdRef`;
- autosave nao deve reidratar o relogio;
- polling/save/reopen nao criam fonte paralela de verdade;
- o snapshot salvo sempre normaliza o estado para pausado.

## Testes

Cobertura adicionada:

- `21Scoutpro/e2e/specs/resume-incomplete-clock.spec.ts`

Fluxo coberto:

1. abrir partida QA realtime;
2. iniciar cronometro;
3. sincronizar para horario conhecido;
4. registrar evento;
5. salvar incompleta;
6. reabrir;
7. validar tempo, periodo, estado e evento;
8. continuar a partida;
9. registrar novo evento;
10. salvar e reabrir novamente.

## Riscos remanescentes

- partidas antigas sem snapshot dependem de sincronizacao manual na primeira reabertura;
- a validacao E2E completa depende do ambiente local com frontend/backend acessiveis e banco QA autorizado;
- o arquivo `21Scoutpro/public/sitemap.xml` mudou por `prebuild` automatico e nao faz parte deste hotfix.

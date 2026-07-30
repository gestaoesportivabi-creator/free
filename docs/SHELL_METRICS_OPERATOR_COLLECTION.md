# Como coletar métricas do Shell na rodada com operadores

Uso: preparar evidência para o portão 004J (`SPRINT_004J_DECISION_GATE.md`) **sem inventar números**.

## Ativar o Shell

- URL: `?coleta=shell` (ou preferência salva “shell” nas settings).
- Rollback imediato: `?coleta=atual`.

## Antes de cada sessão

No DevTools console:

```js
window.__scout21CollectionShellMetrics__ = []
```

Registrar: dispositivo, viewport, modo (realtime/postmatch), ordem A/B (atual×shell), operador anônimo.

## Durante / ao final

Resumo calculado (TTE p50/p95, taps médios, cancel/undo rates, eventos/min):

```js
window.__scout21CollectionShellMetricSummary__?.()
```

Export bruto:

```js
copy(JSON.stringify(window.__scout21CollectionShellMetrics__ ?? [], null, 2))
```

Cole o JSON e o summary no registro da sessão em `SPRINT_004H_OPERATOR_READINESS.md`.

## Baseline do fluxo atual

Repetir a **mesma sequência** com `?coleta=atual`. O helper de summary é do Shell; para o fluxo atual use cronômetro externo / observação até existir instrumentação espelhada. Não compare com números inventados.

## O que não conta como evidência de promoção

- Um único E2E de teclado em localhost.
- Preferência “achada” pela equipe sem operadores de coleta.
- TTE estimado sem timestamps de sessão real.

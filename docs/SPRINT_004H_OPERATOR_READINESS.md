# Sprint 004H — Protocolo de prontidão com operadores

Este documento prepara a rodada qualitativa da 004H/004J. Ele **não contém resultados**, preferências ou métricas inventadas.

## Pré-condições

- Usar um build com as Sprints 004D–004H.
- Executar em tablet paisagem e desktop; registrar modelo, viewport e método de entrada.
- Limpar `window.__scout21CollectionShellMetrics__` antes de cada sessão.
- Usar a mesma sequência no fluxo atual e no Shell.
- Não orientar o operador durante a execução, salvo bloqueio técnico.

## Sequência mínima

1. Iniciar/retomar relógio.
2. Registrar finalização fora, na trave e bloqueada.
3. Registrar falta nossa e adversária.
4. Registrar gol nosso com assistência e gol adversário.
5. Registrar cartão, bola parada e substituição.
6. Corrigir um erro com desfazer.
7. Abrir atalhos e executar ao menos um fluxo somente por teclado.
8. Simular perda e retorno de rede para observar o estado da fila.

## Evidências por sessão

- Gravação ou observação cronometrada, com consentimento.
- Erros de atribuição de atleta em revisão cega.
- Momentos em que o operador tira os olhos da quadra.
- Eventos difíceis de encontrar e uso do overflow.
- Dúvidas sobre sticky athlete, relógio, fila e desfazer.
- Exportação bruta:

```js
copy(JSON.stringify(window.__scout21CollectionShellMetrics__ ?? [], null, 2))
```

- Resumo calculado:

```js
window.__scout21CollectionShellMetricSummary__?.()
```

Guia curto: [SHELL_METRICS_OPERATOR_COLLECTION.md](./SHELL_METRICS_OPERATOR_COLLECTION.md).

## Gates do plano

- TTE p50 ≤ 1.200 ms e melhor que baseline.
- TTE p95 ≤ 3.000 ms.
- Média de interações por evento ≤ 2,4.
- Cancel rate ≤ 5%.
- Undo rate ≤ 3%.
- Eventos/minuto ≥ baseline.
- Erros de atribuição ≤ baseline.
- Equivalência de dados: diff vazio.
- Preferência declarada por operadores reais ≥ 70%.

Preferência deve ser perguntada **depois** das duas experiências, com ordem alternada entre participantes.

## Registro de resultado — preencher após a rodada

- Data:
- Operadores participantes:
- Dispositivos/viewports:
- Ordem das experiências:
- Baseline atual:
- Métricas Shell:
- Erros de atribuição:
- Preferência declarada:
- Observações:
- Decisão: promover / ajustar / interromper.

Nenhum campo acima foi preenchido nesta sprint porque a rodada com operadores reais ainda não ocorreu.

# Sprint 004C.1A
## Shell Experimental - Arquitetura Visual e Densidade Operacional

Data de fechamento técnico: July 28, 2026
Branch: `feature/shell-experimental-coleta`

### 1. Problema inicial

O Shell experimental da Sprint 004C.1 já estava funcional, com:

- flag `?coleta=shell`;
- contrato compartilhado de Finalização;
- save e reabertura compartilhados;
- domínio único com o fluxo atual.

O problema desta Sprint era exclusivamente visual e operacional:

- cabeçalho alto demais para notebook e tablet horizontal;
- excesso de espaço morto entre título, alerta e métricas;
- painel lateral pouco útil;
- área principal de registro começando tarde demais na primeira dobra.

### 2. Decisões de arquitetura visual

A refatoração manteve o domínio intacto e redesenhou apenas a casca visual do experimento.

#### 2.1 Wireframe textual final

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Shell experimental · Finalizacao · Ações secundárias                │
│ Tempo | Placar | Faltas | Controles do relógio                      │
├───────────────────────────────────────┬──────────────────────────────┤
│ Fluxo atual da Finalizacao            │ Contexto operacional         │
│ - próximo passo                       │ - estado da coleta           │
│ - passo corrente                      │ - alerta prioritário         │
│ - ação principal do passo             │ - persistência               │
│ - voltar / cancelar / confirmar       │ - modo                       │
├───────────────────────────────────────┴──────────────────────────────┤
│ Eventos recentes (resumo, sem duplicar o log oficial)               │
└──────────────────────────────────────────────────────────────────────┘
```

#### 2.2 Componentes alterados

- `21Scoutpro/App.tsx`
- `21Scoutpro/components/MatchScoutingWindow.tsx`
- `21Scoutpro/components/RealtimeScoutPage.tsx`
- `21Scoutpro/components/ScoutTable.tsx`
- `21Scoutpro/components/CollectionShellExperimental.tsx`
- `21Scoutpro/components/collection-shell/ShellOperationalHeader.tsx`
- `21Scoutpro/components/collection-shell/ShellFinalizationFlow.tsx`
- `21Scoutpro/components/collection-shell/ShellRecentEvents.tsx`
- `21Scoutpro/components/collection-shell/ShellStatusPanel.tsx`
- `21Scoutpro/components/collection-shell/types.ts`
- `21Scoutpro/utils/collectionExperience.ts`
- `21Scoutpro/e2e/helpers/scout-flow.ts`
- `21Scoutpro/e2e/specs/shell-finalization.spec.ts`

#### 2.3 O que permaneceu fora do escopo

Nenhuma regra foi alterada em:

- `ClockService`;
- `useMatchClock`;
- save;
- autosave;
- reabertura;
- backend;
- banco;
- payload;
- classificação oficial de eventos.

### 3. Contrato de domínio preservado

O Shell continua sendo apenas uma composição visual.

Respostas objetivas:

1. A função oficial da Finalização é `registerSharedFinalization()` em `MatchScoutingWindow.tsx`.
2. O fluxo atual ainda usa essa função, delegando para `handleRegisterShot()`.
3. O Shell usa exatamente a mesma função via prop `onRegisterFinalization`.
4. Nenhum objeto persistente de evento é criado dentro do Shell.
5. Nenhum cálculo de tempo é feito dentro do Shell.
6. Nenhum acesso direto à API é feito dentro do Shell.
7. Não existe cópia persistente de `matchEvents` dentro do Shell.
8. Não foi introduzida regra duplicada entre realtime e pós-jogo.

Resumo:

- o Shell recebe projeções visuais do domínio;
- o registro continua acontecendo no pipeline oficial;
- save, reabertura, timestamp e período continuam compartilhados.

### 4. Comparação antes x depois

Capturas geradas em:

- baseline: `.codex-artifacts/shell-visual-audit/baseline/`
- after: `.codex-artifacts/shell-visual-audit/after/`

Relatórios:

- baseline: `.codex-artifacts/shell-visual-audit/baseline-report.json`
- after: `.codex-artifacts/shell-visual-audit/after-report.json`

Frames de referência mais úteis:

- antes notebook idle: `.codex-artifacts/shell-visual-audit/baseline/notebook-1366-idle.png`
- depois notebook idle: `.codex-artifacts/shell-visual-audit/after/notebook-1366-idle.png`
- antes tablet result-selection: `.codex-artifacts/shell-visual-audit/baseline/tablet-1280-result-selection.png`
- depois tablet result-selection: `.codex-artifacts/shell-visual-audit/after/tablet-1280-result-selection.png`

#### 4.1 Métricas principais

##### 1920x1080

- header idle: `354.75px -> 247px` (`-107.75px`)
- início do fluxo: `626.75px -> 515px` (`-111.75px`)
- altura útil do fluxo: `373.25px -> 485px` (`+111.75px`)
- largura do painel contextual: `648px -> 587.16px`

##### 1366x768

- header idle: `354.75px -> 247px` (`-107.75px`)
- início do fluxo: `626.75px -> 515px` (`-111.75px`)
- painel contextual mais estreito e mais objetivo: `456.23px -> 413.77px`

##### 1280x800

- header idle: `354.75px -> 247px` (`-107.75px`)
- início do fluxo: `626.75px -> 515px` (`-111.75px`)
- painel contextual: `426.47px -> 386.83px`

#### 4.2 Espaços mortos eliminados

- bloco alto de título + subtítulo + alerta removido do topo do header;
- alerta operacional saiu do cabeçalho e foi para o painel contextual;
- o início da área principal subiu aproximadamente `111px` nas viewports principais;
- o painel lateral deixou de ser apenas “estado/modo” e passou a concentrar contexto útil.

#### 4.3 Espaços vazios preservados com intenção

- respiro horizontal entre cartões de tempo, placar, faltas e controles;
- separação entre fluxo principal e ações perigosas;
- área lateral suficiente para leitura rápida em tablet horizontal;
- faixa inferior de eventos recentes preservada sem competir com a ação atual.

### 5. Hierarquia visual final

#### 5.1 Cabeçalho

O cabeçalho foi reduzido para:

- selo do experimento;
- título curto em uma linha;
- ações secundárias à direita;
- faixa compacta com tempo, placar, faltas e controles.

#### 5.2 Área principal

A área principal mostra apenas o passo corrente:

- IDLE;
- seleção de atleta;
- seleção de resultado;
- revisão/confirmar;
- sucesso.

Não há reserva visual para eventos futuros ainda não migrados.

#### 5.3 Painel contextual

O painel lateral agora tem função real:

- estado atual da coleta;
- alerta prioritário ou confirmação de ausência de alertas;
- persistência;
- modo de operação.

#### 5.4 Eventos recentes

O resumo continua visível, mas segue separado do fluxo ativo e não duplica o log oficial.

### 6. Responsividade

Viewports validadas:

- `1920x1080`
- `1600x900`
- `1366x768`
- `1280x800`
- `1024x768` como diagnóstico de limite

Resultado:

- `1920x1080`: confortável e com ganho real de área útil;
- `1600x900`: confortável e sem sobreposição;
- `1366x768`: utilizável, com header mais compacto e fluxo visível mais cedo;
- `1280x800`: utilizável em tablet horizontal sem scroll horizontal;
- `1024x768`: degradação controlada, ainda legível, mas com densidade alta e menor margem operacional.

Limite mínimo recomendado neste estágio:

- priorizar `1280x800` ou superior para operação confiável;
- `1024x768` permanece como limite diagnóstico, não como viewport ideal.

### 7. Acessibilidade operacional

Pontos confirmados nos componentes alterados:

- foco visual preservado nos botões principais;
- estados `selected`, `disabled` e `alert` distinguíveis além da cor;
- labels textuais mantidos em ações críticas;
- botões continuam grandes o suficiente para uso em tablet horizontal;
- ações destrutivas ou de risco continuam separadas do fluxo principal.

Pendência qualitativa:

- não houve rodada humana com operadores reais nesta execução.

### 8. Comparação de cliques e tempo

Comparação funcional da Finalização:

- fluxo atual: tende a ser mais curto em cliques, mas mistura decisão e registro sem etapa explícita de revisão;
- Shell: adiciona uma confirmação final e reduz ambiguidade operacional.

Estimativa operacional:

- fluxo atual: `evento -> atleta -> resultado`
- Shell: `iniciar fluxo -> atleta -> resultado -> confirmar`

Conclusão:

- o Shell sacrifica um clique para ganhar previsibilidade, reversão e clareza de estado.

### 9. Testes executados

Executados em July 28, 2026:

- `npm run build` no frontend: aprovado
- `npm run type-check` no backend: aprovado
- `GET /health`: aprovado
- `shell-finalization.spec.ts`: aprovado
- captura visual before/after: aprovada
- suíte completa Playwright: `15/15` aprovada

Resultado da suíte completa:

- `cleanup-dry-run.spec.ts`
- `clock-controls.spec.ts`
- `full-match-cycle.spec.ts`
- `persistence.spec.ts`
- `postmatch-data-entry.spec.ts`
- `qa-smoke.spec.ts`
- `resume-incomplete-clock.spec.ts`
- `shell-finalization.spec.ts`

Todos os `15` testes passaram no estado final.

### 10. Type-check do frontend

`npm run type-check` do frontend continua falhando.

Classificação:

- dívida histórica pré-existente;
- sem erros novos nos arquivos do Shell (`CollectionShellExperimental` e `collection-shell/*`);
- erros existentes também aparecem em `App.tsx` e `ScoutTable.tsx`, mas em linhas fora dos trechos alterados nesta Sprint.

### 11. Limitações

- comparação qualitativa com operadores reais não foi executada nesta rodada;
- `1024x768` segue apenas como limite de diagnóstico;
- o Shell ainda cobre apenas Finalização;
- o fluxo atual continua sendo o padrão, e isso é intencional.

### 12. Próximos passos recomendados

#### Próxima Sprint sugerida

Evoluir o Shell experimental sem quebrar o contrato único:

- pilotar um segundo evento com a mesma arquitetura;
- adicionar validação qualitativa com operadores reais;
- consolidar o painel contextual com prioridade de alertas mais forte;
- decidir se a coluna lateral de atletas deve aparecer como trilha fixa quando novos eventos entrarem;
- medir se a etapa de confirmação compensa em campo ou precisa de atalho operacional.

### 13. Resumo final

Esta Sprint redesenhou apenas o Shell experimental.

Entregas centrais:

- cabeçalho significativamente mais compacto;
- área principal visível mais cedo;
- painel contextual com utilidade real;
- domínio único preservado;
- fluxo atual intacto;
- flag `?coleta=shell` preservada;
- suíte funcional final verde.

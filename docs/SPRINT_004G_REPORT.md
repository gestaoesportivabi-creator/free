# Sprint 004G — Resiliência e fila local

Data: 2026-07-29  
Branch: `feature/shell-experimental-coleta`  
Commit: nenhum

## Resultado

A Sprint 004G adiciona uma fila local de persistência ao Shell sem criar uma segunda implementação de eventos e sem alterar os handlers de domínio. `matchEvents` continua sendo a fonte de verdade em memória; a fila guarda snapshots produzidos pelo `MatchScoutingWindow` e os entrega ao callback `onSave` já existente.

A experiência atual continua padrão e não usa a fila nova. O Shell permanece uma casca: não faz `fetch`, não monta `MatchEvent` e não conhece o endpoint.

## Arquitetura entregue

### Fila local

Arquivo: `21Scoutpro/utils/collectionSaveQueue.ts`

- Persistência em `localStorage`, isolada por partida e versionada em `v1`.
- Cada entrada guarda:
  - snapshot monolítico já produzido pelo domínio;
  - assinatura do snapshot;
  - IDs totais e IDs ainda pendentes;
  - tentativas e instante da próxima retentativa;
  - timestamps de criação/atualização.
- Alterações sucessivas são coalescidas no snapshot mais recente. Isso evita reproduzir vários `PUT`s antigos e não muda a ordem ou semântica de `matchEvents`.
- A fila é gravada assim que a assinatura persistível muda, antes do debounce de autosave.
- A remoção usa assinatura esperada: uma resposta antiga não apaga um snapshot mais novo que entrou durante o request.
- Falha de `localStorage` não bloqueia o save online existente.

### Save existente e backoff

`MatchScoutingWindow` continua chamando somente `onSave`.

- Autosave pega o snapshot da fila e usa o caminho de persistência existente.
- Falhas mantêm a entrada e aplicam backoff de `1s, 2s, 4s...`, limitado a `30s`.
- Retentativas ocorrem por timer e também ao receber `online` ou ao documento voltar a ficar visível.
- Saves manuais/finalização também colocam o snapshot na fila antes de chamar `onSave`.
- `RealtimeScoutPage` agora propaga falha de autosave ao chamador; alertas manuais permanecem como antes.
- `beforeunload` considera fila/saving, inclusive quando não existe apenas um diff React pendente.

### Correção pós-004J — drain confiável na reconexão

A regressão 004J mostrou a fila parada em `1` depois do `online`. Três causas reais foram corrigidas em `utils/collectionSaveQueue.ts` + `MatchScoutingWindow`:

1. **Closure obsoleta do autosave (causa principal).** Os reagendamentos (`finally`, timer de retry, debounce, intervalo, retomada) chamavam a cópia de `saveSilently` do render em que foram criados. Uma cópia antiga montava o snapshot com `matchEvents` desatualizado (sem o lance recém-registrado) e o gravava na fila; a versão nova regravava com o lance. As duas alternavam indefinidamente e a fila nunca ficava vazia — além de chegar a enviar `postMatchEventLog` vazio ao servidor. Agora todos os caminhos diferidos passam por `saveSilentlyRef`, sempre a versão mais recente.
2. **Assinatura da fila incluía relógio e posse.** `signature` era o snapshot inteiro; com o cronômetro andando isso gerava uma entrada nova por segundo e impedia a remoção pós-save. A identidade agora é `collectionQueueSignature` (eventos, substituições, escalação, fase, status); avanço de relógio apenas atualiza o snapshot da entrada existente, preservando `attempts`/backoff.
3. **Backoff não zerava na retomada.** `resetCollectionSaveBackoff` zera tentativas no `online`/`visibilitychange`, e uma falha de requisição iniciada *antes* da retomada não reaplica backoff nem ressuscita entrada já drenada.

Verificação: `e2e/specs/shell-save-queue.spec.ts` **3/3 verdes** com `--repeat-each=3`; `collection-save-queue-domain.spec.ts` **5 passed** (dois casos novos: tick de relógio e reset de backoff).

### Reconciliação na retomada

Ao reabrir uma partida no Shell:

- se todos os eventos do servidor são subconjunto da fila e a fila tem eventos adicionais, o domínio reidrata o snapshot local e tenta persistir pelo fluxo normal;
- se o servidor já contém todos os eventos locais e está à frente, a entrada local é descartada;
- se servidor e fila divergiram, nenhum lado é sobrescrito automaticamente e o Shell mostra um aviso de reconciliação pendente.

Essa regra evita um “merge mágico” de eventos e não inventa resolução de conflito dentro do `PUT` monolítico.

### Estado no Command Bar

O Command Bar recebe a projeção de persistência do domínio:

- `☁ salvo Ns`;
- `⟳ salvando`;
- `⚠ N na fila`.

O Shell também mostra um banner ao restaurar eventos locais ou detectar conflito.

## Dívida formal de backend — input para sprint própria

### Problema

A coleta ainda persiste todo o `postMatchEventLog` por um único `PUT /api/matches/:id`. Cada autosave reenvia o jogo inteiro.

Riscos que a fila cliente reduz, mas não elimina:

1. duas abas/dispositivos continuam em estratégia “último PUT vence”;
2. payload e custo crescem linearmente com o jogo;
3. não existe confirmação individual/idempotente por evento;
4. conflito real não pode ser mesclado com segurança no cliente;
5. `localStorage` é local ao navegador/perfil e não oferece recuperação entre dispositivos.

### Entrada recomendada para sprint de backend

Criar persistência incremental de eventos, separada do snapshot agregado:

- endpoint append-only por evento ou lote pequeno;
- `eventId` como chave idempotente;
- versão/revisão da partida para concorrência otimista;
- resposta com IDs confirmados e revisão atual;
- endpoint de leitura de eventos desde uma revisão/cursor;
- tombstone ou comando explícito para undo, sem reescrever todo o log;
- job/projeção para recompor o snapshot analítico atual;
- migração compatível mantendo o `PUT` durante transição.

Até essa API existir, a fila 004G deliberadamente coalesce snapshots completos e não promete sincronização multiaba, cross-device ou background sync após o navegador ser encerrado.

## Arquivos da 004G

- `21Scoutpro/utils/collectionSaveQueue.ts` — novo
- `21Scoutpro/components/MatchScoutingWindow.tsx`
- `21Scoutpro/components/CollectionShellExperimental.tsx`
- `21Scoutpro/components/collection-shell/ShellCommandBar.tsx`
- `21Scoutpro/components/collection-shell/types.ts`
- `21Scoutpro/components/RealtimeScoutPage.tsx`
- `21Scoutpro/e2e/specs/collection-save-queue-domain.spec.ts` — novo
- `21Scoutpro/e2e/specs/shell-save-queue.spec.ts` — novo
- `docs/SPRINT_004G_REPORT.md` — novo

Arquivos e documentos não relacionados já existentes no working tree foram preservados.

## Verificação executada

### Build

`npx vite build --outDir /tmp/scout21-004g-check`

Resultado: **verde**, 2727 módulos transformados. Permanecem os avisos conhecidos de placeholders de analytics, imports mistos e chunk principal grande.

### TypeScript

O typecheck global continua com dívida histórica. A saída filtrada para os arquivos da fila, Shell, `MatchScoutingWindow` e `RealtimeScoutPage` apresentou **0 erros da 004G**.

### Testes

- `collection-save-queue-domain.spec.ts` + `event-specs-domain.spec.ts`: **7 passed**.
  - coalescência e IDs pendentes;
  - backoff exponencial e limite;
  - proteção contra resposta antiga;
  - decisões restore/server-ahead/conflict.
- `shell-save-queue.spec.ts`: **1 passed** em 1,4 min.
  - intercepta POST/PUT da partida;
  - confirma entrada em `localStorage`;
  - confirma `⚠ N na fila`;
  - restaura rede via evento `online`;
  - confirma remoção da fila e `☁ salvo`.
- `shell-equivalence.spec.ts` + `shell-finalization.spec.ts`: **4 passed** em 6,1 min.

## Lacunas honestas

- Não há sincronização entre abas ou dispositivos.
- Não há Service Worker/Background Sync; retentativa exige a página aberta ou uma reabertura posterior.
- Conflito divergente é preservado e sinalizado, não mesclado automaticamente.
- A fila guarda o snapshot completo porque a API continua monolítica; os IDs pendentes são rastreamento/reconciliação, não commits individuais no servidor.
- Quota/indisponibilidade de `localStorage` degrada para o autosave online existente.
- A suíte Playwright completa do produto não foi executada; foram executados os testes focados e as regressões de Shell/equivalência.
- Não foram inventadas métricas de arena nem testes offline reais em dispositivo.

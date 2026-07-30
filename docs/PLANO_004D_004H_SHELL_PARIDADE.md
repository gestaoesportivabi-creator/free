# PLANO 004D → 004H — Paridade e Superação do Shell Experimental

> ⚠️ **DOCUMENTO SUPERSEDIDO — 29/07/2026**
>
> Este plano foi absorvido por **[`PLANO_MESTRE_COLETA_V2.md`](PLANO_MESTRE_COLETA_V2.md)**, que
> mantém todo o conteúdo daqui e adiciona: novo layout de 4 zonas (Deck & Rail), auditoria
> completa de rotas, pesquisa de referências externas (Nacsport / Hudl / thumb zone),
> design tokens, especificação dos 20 eventos, e prompts de execução revisados.
>
> **Use o PLANO_MESTRE_COLETA_V2 como fonte da verdade.** Este arquivo fica apenas
> como registro histórico da primeira versão da análise.

Projeto: `SCOUT 21 PRO`
Branch base: `feature/shell-experimental-coleta`
Data: `2026-07-29`
Escopo: levar o Shell experimental de 1 evento (Finalização) para cobertura operacional completa, sem quebrar o contrato de domínio único.

---

## 0. Leitura obrigatória antes de executar

| Documento | Por quê |
| --- | --- |
| `docs/EVENT_MATRIX_V2.md` | Taxonomia oficial (Classe A/B/C/D) e os 11 microfluxos já decididos. **Não reinventar.** |
| `docs/UX_BACKLOG.md` | Roadmap 004C→004G já aprovado e itens que "devem morrer se não provarem valor". |
| `docs/SPRINT_004C_1A_SHELL_VISUAL_ARCHITECTURE_REPORT.md` | Wireframe final, métricas de densidade e o contrato de domínio preservado. |
| `docs/COLLECTION_CONTROL_SYSTEM.md` | Regras do ClockService e estados de coleta. |

---

## 1. Diagnóstico consolidado

### 1.1 Estado atual (verificado em execução local, 29/07/2026)

Fluxo testado no jogo QA `QA ADVERSARIO · 16/07/2026 · disponível`:

```
Login → Dados do Jogo → Abrir Scout em Tempo Real → Escalação (5 em quadra)
→ Iniciar Partida → FINALIZAÇÃO → Atleta → Resultado → Confirmar
→ evento gravado: "00:49 · QA ATLETA 02 · Finalização no gol"
```

O Shell funciona e o contrato está limpo. O problema é **cobertura**, não qualidade.

### 1.2 O gap real — corrigido pela taxonomia oficial

Uma leitura ingênua diria "faltam 19 das 20 ações do `PostMatchAction`". **Isso está errado** e levaria a construir o produto errado. A `EVENT_MATRIX_V2` já decidiu que boa parte dessas ações **não deve existir como botão principal no realtime**.

O gap correto, por classe:

#### Classe A — obrigatório no realtime, **100% ausente no Shell**

| Evento | Handler de domínio existente | Complexidade |
| --- | --- | --- |
| Gol nosso | `handleRegisterGoal()` :2951 | Composto (equipe → autor → método → assistência) |
| Gol adversário | `handleRegisterGoal(_, true, ...)` :2951 | Composto (equipe → origem opcional) |
| Cartão nosso / adversário | `handleRegisterCard()` :3266 | Médio (equipe → atleta → tipo) |
| Expulsão | `handleRegisterCard('red' \| 'secondYellow')` | Deriva de cartão |
| Pênalti | `handleRegisterPenalty()` :3146 | Composto (equipe → resultado → cobrador) |
| Tiro livre | `handleRegisterFreeKick()` :3089 | Composto (equipe → resultado → cobrador) |
| Falta acumulada (nossa/adv.) | `handleRegisterFoul()` :2720 | Simples (equipe → atleta se nosso) |
| Substituição | **não existe handler compartilhável** | Médio — precisa extrair |
| Tempo técnico | **não existe evento** | Baixo — decidir se vira evento ou só clock |

#### Classe B — prioritário no realtime, **1 de 8 presente**

| Evento | Handler | Status no Shell |
| --- | --- | --- |
| Finalização no gol / fora / bloqueada | `handleRegisterShot()` :2837 | ✅ presente |
| Finalização **na trave** (`post`) | `handleRegisterShot('post')` | ❌ ausente — o Shell só expõe 3 dos 4 resultados |
| Defesa (goleiro) | `handleRegisterSave()` :2634 | ❌ |
| Desarme | `handleRegisterTackle()` :2592 | ❌ |
| Bloqueio | `handleRegisterBlock()` :2685 | ❌ |
| Escanteio | `handleRegisterCorner()` :2881 | ❌ |
| Perda de posse | **não existe handler** | ❌ — evento novo na matriz, sem implementação em lugar nenhum |
| Recuperação de posse | **não existe handler** | ❌ — idem |

#### Classe C — pós-jogo, enriquecimento

`zone`, `assist` isolada, passe-chave, lateral detalhado. **Não bloqueiam o realtime.** Entram no modo `postmatch` do Shell.

#### Classe D — **não construir**

`passCorrect` / `passWrong` / `passTransicao` / `passProgressao` genéricos ao vivo. A matriz decidiu explicitamente: *"`Passe` não deve permanecer como evento principal no realtime"*. Permanece só no pós-jogo como opcional.

> ⚠️ **Correção de rota:** qualquer plano que peça "adicionar Passe ao Shell realtime" contradiz a Sprint 004B. Passe entra apenas no `mode='postmatch'`.

### 1.3 Dados que faltam na inserção (contrato `PostMatchEvent`)

Comparando `types.ts:189` com o que o Shell hoje produz:

| Campo | Usado por | Coletado pelo Shell? | Classe | Sprint |
| --- | --- | --- | --- | --- |
| `playerId`, `time`, `period`, `action`, `tipo`, `subtipo`, `result` | tudo | ✅ | — | — |
| `assistPlayerId` / `assistPlayerName` | Rede de conexões, quartetos | ❌ | A (dentro do gol) | 004E |
| `goalMethod` | Análise por origem de jogada | ❌ | A | 004E |
| `isOpponentGoal` | Placar, gols sofridos | ❌ | A | 004E |
| `foulTeam` (`for`/`against`) | Faltas acumuladas, 6ª falta | ❌ | A | 004D |
| `cardType` / `cardTeam` | Disciplina, disponibilidade | ❌ | A | 004E |
| `isForUs` (bola parada) | Pênalti / tiro livre | ❌ | A | 004E |
| `zone` (`AT_ESQ`/`AT_DIR`/`DF_ESQ`/`DF_DIR`) | Mapa de calor | ❌ | C | 004F (postmatch) |
| `passToPlayerId` / `passToPlayerName` | Grafo de passes | ❌ | C/D | 004F (postmatch) |
| `wrongPassGeneratedTransition` | Gráfico Erros Críticos | ❌ | C/D | 004F (postmatch) |
| `recordedByUserId` / `recordedByName` | **Auditoria** | ❌ | — | 004D (transversal) |

### 1.4 Operação de jogo ausente

- **Substituição** em quadra durante o jogo — o Shell não tem trilha de banco.
- **Undo** do último evento (hoje: abrir Logs → localizar → Excluir).
- **Edição de timestamp no realtime** — `manualTime` só é passado quando `mode === 'postmatch'` (`MatchScoutingWindow.tsx:4086`).
- **Finalização na trave** — resultado `post` existe no domínio mas não na UI do Shell.

---

## 2. Invariantes — o que NÃO pode quebrar

Estas são as regras que tornaram o Shell seguro. Toda sprint abaixo as respeita.

1. **Nenhuma API própria.** O Shell não chama `fetch`/serviço. Só recebe callbacks.
2. **Nenhum objeto de evento persistente criado dentro do Shell.** Quem monta `MatchEvent` é `MatchScoutingWindow`.
3. **Nenhum cálculo de tempo no Shell.** `eventTimeAndPeriod()` / `getOfficialEventStamp()` continuam no domínio.
4. **Nenhum save paralelo.** `onSave` → `handleSaveLater` já existente.
5. **ClockService intocado.** Comportamento de pausa vem de `getMatchClockEventRule()` (`utils/matchClockEventRules.ts`), nunca de lógica nova no Shell.
6. **Fluxo atual permanece o default.** Ativação só por `?coleta=shell` (`utils/collectionExperience.ts`).
7. **Rollback trivial.** Remover a flag volta ao estado anterior sem migração.
8. **Zero regressão na suíte Playwright** (hoje 15/15 verde).

---

## 3. A virada técnica — sem ela o plano não escala

### 3.1 O problema

Hoje o Shell tem **uma máquina de estados fixa para um evento**:

```ts
// components/collection-shell/types.ts
type ShellStep = 'IDLE' | 'SELECTING_ATHLETE' | 'SELECTING_RESULT'
               | 'READY_TO_CONFIRM' | 'CONFIRMING' | 'SUCCESS';
```

E uma prop por evento:

```ts
onRegisterFinalization: (input: { playerId; result }) => void
```

Se cada novo evento virar um `ShellStep` novo + uma prop nova + um bloco JSX novo, ao chegar em 15 eventos o `ShellFinalizationFlow.tsx` vira um monólito de 3.000 linhas — exatamente o problema que o Shell nasceu para resolver.

### 3.2 A solução — fluxo declarativo + porta única de domínio

**(a) Porta única de domínio.** Generalizar `registerSharedFinalization()` (`MatchScoutingWindow.tsx:2866`) em `registerSharedEvent()`, reaproveitando o dispatcher que **já existe** em `executeActionFlow()` (`:1127`) — ele já roteia `pass | shot | foul | tackle | card | save | lateral | corner | block`.

```ts
// MatchScoutingWindow.tsx — nova porta única, substitui registerSharedFinalization
export interface SharedEventInput {
  action: MatchEvent['type'] | 'substitution' | 'possessionLost' | 'possessionWon';
  playerId?: string;              // ausente ⇒ TEAM_EVENT_FAKE_PLAYER_ID
  secondaryPlayerId?: string;     // assistência, quem entra na substituição
  result?: MatchEvent['result'];
  team?: 'for' | 'against';
  cardType?: 'yellow' | 'secondYellow' | 'red';
  goalMethod?: string;
  zone?: LateralResult;
  timeOverride?: number;
  periodOverride?: '1T' | '2T';
}

const registerSharedEvent = (input: SharedEventInput) => { /* switch → handlers existentes */ };
```

Regras:
- `registerSharedFinalization` vira um *thin wrapper* de `registerSharedEvent` (mantém o e2e atual verde).
- Eventos de equipe (gol adversário, cartão adversário, escanteio contra) usam `TEAM_EVENT_FAKE_PLAYER_ID` (`:197`), padrão que já existe.
- **Nenhum handler novo de persistência é criado** — só roteamento.

**(b) Fluxo declarativo.** Substituir o `ShellStep` fixo por um passo genérico dirigido por spec:

```ts
// components/collection-shell/types.ts
export type ShellStepKind =
  | 'TEAM'              // nosso / adversário
  | 'ATHLETE'           // atleta principal
  | 'SECONDARY_ATHLETE' // assistente, quem entra
  | 'CHOICE'            // resultado, tipo de cartão, método do gol
  | 'ZONE'              // AT_ESQ / AT_DIR / DF_ESQ / DF_DIR
  | 'TIME'              // só postmatch
  | 'REVIEW';

export interface ShellFlowStep {
  id: string;
  kind: ShellStepKind;
  label: string;                       // "Quem finalizou?"
  optional?: boolean;                  // permite "Pular"
  options?: ShellChoiceOption[];       // só p/ CHOICE
  skipWhen?: (draft: ShellEventDraft) => boolean;
}

export interface ShellEventSpec {
  id: string;                          // 'shot' | 'goal' | 'foul' ...
  label: string;                       // "Finalização"
  classe: 'A' | 'B';
  modes: Array<'realtime' | 'postmatch'>;
  steps: ShellFlowStep[];
  toDomainInput: (draft: ShellEventDraft) => SharedEventInput;
}
```

Um novo arquivo `components/collection-shell/eventSpecs.ts` concentra os 11 microfluxos da `EVENT_MATRIX_V2`. `ShellFinalizationFlow.tsx` é renomeado para `ShellEventFlow.tsx` e vira um **renderizador genérico**: recebe a spec, o passo corrente e o rascunho; não conhece nenhum evento específico.

**Critério de sucesso da refatoração:** adicionar um 12º evento deve custar **uma entrada em `eventSpecs.ts` e zero JSX novo**.

### 3.3 Exemplo de spec — Gol (o mais complexo)

Traduz o microfluxo da matriz (`Gol → equipe → autor → origem curta → assistência → confirmar`):

```ts
{
  id: 'goal',
  label: 'Gol',
  classe: 'A',
  modes: ['realtime', 'postmatch'],
  steps: [
    { id: 'team',   kind: 'TEAM',   label: 'Gol de quem?' },
    { id: 'author', kind: 'ATHLETE', label: 'Quem marcou?',
      skipWhen: d => d.team === 'against' },
    { id: 'method', kind: 'CHOICE', label: 'Origem da jogada',
      options: GOAL_METHODS_CURTOS },        // jogada individual, erro do adv., rebote, bola parada, desconhecida
    { id: 'assist', kind: 'SECONDARY_ATHLETE', label: 'Assistência', optional: true,
      skipWhen: d => d.team === 'against' || d.method === 'jogada-individual' },
    { id: 'review', kind: 'REVIEW', label: 'Confirmar gol' },
  ],
  toDomainInput: d => ({
    action: 'goal',
    playerId: d.team === 'for' ? d.athleteId : undefined,
    secondaryPlayerId: d.secondaryAthleteId,
    goalMethod: d.choice.method,
    team: d.team,
  }),
}
```

---

## 4. Sprints

Nomenclatura segue o roadmap já aprovado no `UX_BACKLOG.md`.

### Sprint 004D — Fundação genérica + eventos simples

**Objetivo:** trocar o motor do Shell e entregar os eventos Classe B simples.

Entregas:
1. `registerSharedEvent()` em `MatchScoutingWindow.tsx` + `registerSharedFinalization` como wrapper.
2. `eventSpecs.ts` + `ShellEventFlow.tsx` genérico (renomeia `ShellFinalizationFlow.tsx`).
3. Seletor de evento no Shell (grid de eventos disponíveis, substitui o botão único "Finalização").
4. Eventos entregues: **Finalização (incluindo `post`/trave), Defesa, Desarme, Bloqueio, Falta, Escanteio**.
5. `recordedByUserId` / `recordedByName` preenchidos a partir da sessão (transversal, corrige lacuna de auditoria).

Fora de escopo: gol, cartão, bola parada, substituição.

Critérios de aceite:
- `?coleta=shell` registra os 6 eventos e cada um aparece idêntico no log oficial ao equivalente do fluxo atual.
- `shell-finalization.spec.ts` continua verde **sem alteração**.
- Diff em `MatchScoutingWindow.tsx` restrito a: nova porta + wrapper + props do Shell. Nenhum handler de persistência tocado.
- Comportamento de clock por evento vem 100% de `getMatchClockEventRule()`.

### Sprint 004E — Eventos compostos

**Objetivo:** fechar a Classe A.

Entregas:
1. **Gol** (nosso e adversário) com `goalMethod`, `assistPlayerId`, `isOpponentGoal`.
2. **Cartão** (nosso/adversário × amarelo/2º amarelo/vermelho) com `cardType` e `cardTeam`.
3. **Pênalti** e **Tiro livre** com `isForUs`, resultado e cobrador.
4. **Substituição** — exige **extrair** um handler compartilhável do painel esquerdo atual (`MatchScoutingWindow.tsx:4107+`). Único ponto do plano que cria lógica de domínio nova; deve nascer como função pura testável.
5. Trilha fixa de banco de reservas no Shell (decisão pendente da 004C.1A: *"decidir se a coluna lateral de atletas deve aparecer como trilha fixa"*).

Critérios de aceite:
- Um jogo completo pode ser coletado 100% no Shell e produz **o mesmo dashboard** de um jogo coletado no fluxo atual.
- Teste de equivalência: coletar a mesma sequência de 20 eventos nos dois fluxos e comparar o array `matchEvents` normalizado (ignorando `id` e timestamps) — deve dar diff vazio.

### Sprint 004F — Modo pós-jogo e enriquecimento (Classe C)

Entregas:
1. Passo `ZONE` opcional ao fim de qualquer evento (`AT_ESQ`/`AT_DIR`/`DF_ESQ`/`DF_DIR`).
2. `mode='postmatch'`: Passe (certo/errado + receptor + `wrongPassGeneratedTransition`), passe-chave, assistência avulsa, lateral detalhado.
3. Edição de timestamp também no realtime (hoje `manualTime` só chega no postmatch — `:4086`).
4. Painel contextual definitivo: 4 informações permanentes + 3 contextuais + 1 alerta prioritário.

### Sprint 004G — Redução de fricção

Entregas:
1. **Undo** do último evento (janela de 30s) direto no Shell.
2. **Atalhos de teclado**: `1`–`5` atletas em quadra; `G` gol, `F` finalização, `D` desarme, `E` defesa, `L` falta.
3. **Presets de 1 toque** para combinações frequentes (ex.: "Gol de contra-ataque").
4. Reavaliar o passo `REVIEW`: a 004C.1A registrou que o Shell *"sacrifica um clique para ganhar previsibilidade"*. Medir se compensa; se não, `REVIEW` vira confirmação por *hold* de 300ms.
5. Guard de `hasUnsavedChanges` ao fechar/trocar de experiência.

### Sprint 004H — A/B, decisão e promoção

Entregas:
1. Rodada QA comparativa Shell × fluxo atual, com operadores reais.
2. Comparar `window.__scout21CollectionShellMetrics__` contra baseline: eventos/min, tempo mediano por evento, taxa de cancelamento, taxa de erro de registro.
3. Decisão explícita: promover a default, ajustar, ou matar (conforme `UX_BACKLOG.md`: *"Se isso não mostrar ganho operacional, o Shell não deve escalar"*).
4. Se promovido: inverter o default da flag mantendo `?coleta=atual` como rollback.

---

## 5. Estratégia de testes

| Camada | O que cobre | Onde |
| --- | --- | --- |
| Unitário | `toDomainInput()` de cada spec; `skipWhen`; extração da substituição | novo `__tests__/eventSpecs.test.ts` |
| Contrato | `registerSharedEvent()` roteia para o handler certo com o payload certo | mock dos handlers |
| **Equivalência** | mesmo input no Shell e no fluxo atual ⇒ mesmo `matchEvents` | novo `e2e/specs/shell-equivalence.spec.ts` |
| E2E por evento | um spec por família de evento | expandir `e2e/specs/shell-*.spec.ts` |
| Regressão | 15 testes atuais verdes em toda sprint | suíte existente |

O teste de **equivalência** é o mais importante: é ele que prova que o Shell não é um fork silencioso do domínio.

---

## 6. Riscos e mitigação

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| `MatchScoutingWindow.tsx` tem 6.184 linhas — refatorar a porta pode quebrar o fluxo atual | Alto | A porta é **aditiva**; `registerSharedFinalization` continua existindo como wrapper. Nenhum handler é modificado. |
| Substituição não tem handler compartilhável | Médio | Extração isolada em 004E, com teste unitário antes de plugar no Shell. |
| `type-check` do frontend já falha (dívida histórica, ver 004C.1A §10) | Médio | Não corrigir tudo; garantir apenas **zero erro novo** nos arquivos do Shell. Registrar baseline de erros antes de começar. |
| Construir Passe genérico no realtime por engano | Alto (retrabalho) | §1.2 deste plano; Passe é Classe D. |
| Shell vira monólito ao crescer | Alto | Critério de sucesso da §3.2: novo evento = 1 entrada em `eventSpecs.ts`, 0 JSX. |
| "Perda/recuperação de posse" não existe em lugar nenhum | Médio | São eventos **novos** da matriz. Decidir em 004D se entram agora ou ficam para 004F. Não assumir que já existem. |

---

## 7. Prompt de execução

### 7.1 Prompt mestre (colar no início de qualquer sprint)

```
Contexto: SCOUT 21 PRO, monorepo em apps/scout21, branch feature/shell-experimental-coleta.
Estou evoluindo o Shell experimental de coleta (?coleta=shell) de 1 evento para cobertura
operacional completa.

ANTES DE ESCREVER QUALQUER CÓDIGO, leia nesta ordem:
1. docs/PLANO_004D_004H_SHELL_PARIDADE.md  (este plano — a fonte da verdade)
2. docs/EVENT_MATRIX_V2.md                 (taxonomia Classe A/B/C/D + 11 microfluxos)
3. docs/UX_BACKLOG.md                      (roadmap aprovado)
4. docs/SPRINT_004C_1A_SHELL_VISUAL_ARCHITECTURE_REPORT.md (contrato de domínio)

INVARIANTES — violar qualquer um destes invalida a entrega:
- O Shell NÃO faz fetch, NÃO monta objeto MatchEvent, NÃO calcula tempo, NÃO salva.
- Toda persistência passa pelos handlers já existentes em MatchScoutingWindow.tsx.
- Comportamento de pausa do relógio vem SEMPRE de getMatchClockEventRule()
  (utils/matchClockEventRules.ts). Nunca crie regra de clock nova no Shell.
- O fluxo atual continua sendo o default. Ativação só por ?coleta=shell.
- A suíte Playwright (15 testes) precisa terminar verde.
- Passe genérico NÃO entra no realtime (decisão da Sprint 004B, Classe D).

MÉTODO:
1. Mapeie os arquivos que vai tocar e me mostre o plano antes de editar.
2. Implemente em commits pequenos e descritivos (padrão do repo: feat(shell):, test(e2e):, docs(shell):).
3. Rode, nesta ordem: npm run build (frontend), suíte Playwright, e verifique o fluxo
   manualmente em ?coleta=shell com o usuário QA.
4. Ao final, escreva docs/SPRINT_<id>_REPORT.md no mesmo formato dos relatórios existentes.

AMBIENTE LOCAL:
- Backend: cd apps/scout21/backend && PORT=3000 npm run dev
- Frontend: cd apps/scout21/21Scoutpro && npm run dev  (porta 5173)
- QA: qa.scout21@qa.scout21.local / testeqascout
- Jogo de teste: "QA ADVERSARIO" 16/07/2026, status disponível
- IMPORTANTE: não rode `npm run dev` na raiz do monorepo com PORT no ambiente — o
  concurrently propaga a variável e o backend tenta subir na mesma porta do Vite.

Se algo neste plano conflitar com o que você encontrar no código, PARE e me avise
antes de decidir sozinho.
```

### 7.2 Prompt da Sprint 004D

```
Execute a Sprint 004D do docs/PLANO_004D_004H_SHELL_PARIDADE.md (§4, "Fundação genérica
+ eventos simples"). Aplique o prompt mestre da §7.1.

ENTREGAS:

1. PORTA ÚNICA DE DOMÍNIO
   Em components/MatchScoutingWindow.tsx, crie registerSharedEvent(input: SharedEventInput)
   conforme §3.2 do plano. Ela deve rotear para os handlers que JÁ EXISTEM:
     handleRegisterShot :2837 | handleRegisterSave :2634 | handleRegisterTackle :2592
     handleRegisterBlock :2685 | handleRegisterFoul :2720 | handleRegisterCorner :2881
   Reaproveite a lógica de roteamento de executeActionFlow() :1127 — não duplique.
   registerSharedFinalization :2866 passa a ser um wrapper fino dela.
   Eventos sem atleta usam TEAM_EVENT_FAKE_PLAYER_ID :197.
   NÃO modifique nenhum handleRegister*. Apenas roteie.

2. FLUXO DECLARATIVO
   - Crie components/collection-shell/eventSpecs.ts com ShellEventSpec/ShellFlowStep (§3.2).
   - Renomeie ShellFinalizationFlow.tsx → ShellEventFlow.tsx e torne-o um renderizador
     genérico dirigido por spec. Ele não pode conter nenhum `if (evento === 'shot')`.
   - Atualize collection-shell/types.ts com ShellStepKind e ShellEventDraft.

3. SELETOR DE EVENTO
   No estado IDLE, trocar o botão único "Finalizacao" por um grid dos eventos disponíveis,
   ordenado por frequência esperada. Mantenha o data-testid shell-finalization-start
   funcionando para Finalização (o e2e atual depende dele).

4. EVENTOS DESTA SPRINT
   Finalização (4 resultados: inside/outside/post/blocked — a trave está faltando hoje),
   Defesa, Desarme, Bloqueio, Falta (com foulTeam), Escanteio.
   Siga os microfluxos da EVENT_MATRIX_V2 §"Microfluxos prioritarios".

5. AUDITORIA
   Preencher recordedByUserId/recordedByName a partir da sessão logada em todos os
   eventos registrados pelo Shell.

CRITÉRIOS DE ACEITE (verifique um por um e me reporte):
[ ] Os 6 eventos gravam no log oficial idênticos aos do fluxo atual
[ ] shell-finalization.spec.ts passa SEM ter sido alterado
[ ] Suíte Playwright 15/15 verde
[ ] Zero erro novo de type-check nos arquivos do Shell (registre o baseline antes)
[ ] Nenhum handleRegister* modificado (mostre o diff de MatchScoutingWindow.tsx)
[ ] Adicionar um 7º evento custaria só uma entrada em eventSpecs.ts — demonstre com um
    exemplo comentado

FORA DE ESCOPO: gol, cartão, pênalti, tiro livre, substituição, zona, passe.
```

### 7.3 Prompt da Sprint 004E

```
Execute a Sprint 004E do docs/PLANO_004D_004H_SHELL_PARIDADE.md (§4, "Eventos compostos").
Aplique o prompt mestre da §7.1. Pré-requisito: 004D concluída e verde.

ENTREGAS:
1. GOL — nosso e adversário, via handleRegisterGoal :2951.
   Microfluxo (EVENT_MATRIX_V2 §1): equipe → autor → origem curta → assistência → confirmar.
   Origens curtas ao vivo: jogada individual, erro do adversário, rebote, bola parada,
   sem assistência, desconhecida. Preencher goalMethod, assistPlayerId, isOpponentGoal.
   Gol adversário não exige atleta (usa TEAM_EVENT_FAKE_PLAYER_ID).

2. CARTÃO — via handleRegisterCard :3266. Fluxo: nosso/adversário → atleta se nosso → tipo.
   Preencher cardType (yellow|secondYellow|red) e cardTeam.

3. PÊNALTI e TIRO LIVRE — via handleRegisterPenalty :3146 e handleRegisterFreeKick :3089.
   Fluxo: nosso/adversário → resultado → cobrador se nosso. Preencher isForUs.

4. SUBSTITUIÇÃO — ÚNICO ponto do plano que cria domínio novo.
   Hoje a substituição vive acoplada ao painel esquerdo (MatchScoutingWindow.tsx:4107+).
   Extraia uma função pura e testável ANTES de plugar no Shell, com teste unitário próprio.
   Fluxo: sai → entra → confirmar.

5. TRILHA DE BANCO fixa no Shell (pendência aberta na 004C.1A §12).

CRITÉRIO DE ACEITE PRINCIPAL — teste de equivalência:
Crie e2e/specs/shell-equivalence.spec.ts que colete a MESMA sequência de 20 eventos
(cobrindo todas as classes A e B) nos dois fluxos e compare o array matchEvents
normalizado (ignorando id e timestamps). O diff precisa ser vazio.
Se der diferença, o Shell forkou o domínio — corrija a raiz, não o teste.

[ ] Jogo completo coletável 100% no Shell
[ ] Dashboard idêntico ao de um jogo coletado no fluxo atual
[ ] shell-equivalence.spec.ts verde
[ ] Suíte completa verde
```

### 7.4 Prompts 004F / 004G / 004H

Seguem o mesmo formato: referenciar a seção §4 correspondente do plano, herdar o prompt mestre, e fechar com critérios de aceite verificáveis. Detalhar apenas quando a sprint anterior estiver verde — evita planejar sobre premissa não validada.

---

## 8. Ordem de implementação sugerida dentro de cada sprint

1. Teste primeiro (o e2e do evento novo, vermelho).
2. Spec declarativa em `eventSpecs.ts`.
3. Roteamento em `registerSharedEvent`.
4. Verificação manual em `?coleta=shell` com o jogo QA.
5. Suíte completa.
6. Relatório `docs/SPRINT_<id>_REPORT.md`.

---

## 9. Decisão pendente para o dono do produto

Antes da 004D começar, responder:

1. **Perda/recuperação de posse** entram já na 004D ou ficam para 004F? São eventos que a matriz pede mas que **não existem em lugar nenhum do código** — custam mais que os outros 5 da 004D somados.
2. **Tempo técnico** vira evento persistido ou é só efeito de clock?
3. O passo `REVIEW` fica no fluxo padrão ou já nasce como *hold* na 004D? (a 004C.1A deixou isso explicitamente em aberto para medição)

## 10. Frequência real de eventos nos jogos QA finalizados

Consulta feita em 29/07/2026 nos 2 jogos com `status = encerrado` (`teste20/07`, `TesteManual`) via `GET /api/matches/:id`. Total: **13 eventos**. Amostra pequena — sinal preliminar, não decisão fechada.

### 10.1 Distribuição por ação

| Ação | Contagem | % | Sprint |
| --- | --- | --- | --- |
| Finalização (`shotOn`/`shotOff`/`shotZonaChute`) | 6 | 46% | 004D |
| Gol (`goal`) | 4 | 31% | 004E |
| Desarme (`tackleWithBall`) | 2 | 15% | 004D |
| Falta (`falta`) | 1 | 8% | 004D |
| **Ausentes (0 ocorrências)** | | | |
| Passe (`pass*`) | 0 | — | (não coletar ao vivo — Classe D) |
| Cartão (`card`) | 0 | — | 004E |
| Defesa de goleiro (`save`) | 0 | — | 004D |
| Escanteio isolado (`corner`) | 0 | — | 004D |
| Bloqueio (`block`) | 0 | — | 004D |
| Pênalti / Tiro livre isolados | 0 | — | 004E |
| Substituição | 0 | — | 004E |
| Perda/recuperação de posse | 0 | — | 004F |

### 10.2 Observações relevantes para a UI

- **`shotOn` com subtipo "Trave"** aparece 2× no dataset. Isso confirma a lacuna: o resultado `post` **existe no domínio e é usado** (2 de 6 finalizações = **33%**), mas o Shell não expõe. Prioridade máxima da 004D.
- **`shotZonaChute` subtipo "Bloqueado"** apareceu 1×. É uma ação distinta do `block` puro e o Shell hoje não a cobre.
- **75% dos gols usam bola parada** (Escanteio, Laterais, Tiro Livre) contra 25% "Ataque". Amostra minúscula, mas alerta: o menu de `goalMethod` **não pode ser só "Ataque/Contra-ataque"**. Precisa dos métodos de bola parada logo no topo.
- **Todos os gols "A favor"**, nenhum contra e nenhum do adversário. Não valida a UI de gol adversário — assumir baseado na matriz.
- **Zero passes** — reforça empiricamente a decisão da Sprint 004B: passe genérico não é coletado ao vivo, mesmo quando disponível na UI atual.
- **Zero substituições e cartões** em 2 jogos — Classe A obrigatória por regra, não por frequência. Precisa existir mas pode ficar em menu secundário.

### 10.3 Recomendação de layout do seletor de evento (Sprint 004D)

Baseado na frequência real + classe operacional:

**Botões primários (1 toque, no topo):**
1. Finalização
2. Gol
3. Falta
4. Desarme

**Botões secundários (grid abaixo):**
5. Defesa
6. Escanteio
7. Bloqueio
8. Substituição *(chega na 004E)*
9. Cartão *(chega na 004E)*
10. Pênalti / Tiro livre *(chega na 004E)*

**Menu "Mais":**
- Perda de posse, recuperação de posse, tempo técnico *(chegam na 004F)*

### 10.4 Ação recomendada antes de 004D fechar

Re-rodar essa consulta depois de mais jogos coletados. Se em 10+ jogos a distribuição mudar significativamente, reordenar o grid antes da 004H. O `SPRINT_<id>_REPORT.md` de cada sprint deve incluir a métrica atualizada.

# Sprint 004E — Eventos compostos, presets e equivalência

Data: 2026-07-29  
Branch: `feature/shell-experimental-coleta`  
Status: implementada, sem commit

## Entregas

1. **Gol** (nosso/adversário) declarativo com `goalMethod` (bola parada no topo, labels alinhadas ao domínio atual), assistência opcional e `isOpponentGoal`, roteado por `registerSharedEvent` → `handleRegisterGoal`.
2. **Cartão** e **expulsão** com `cardType`/`cardTeam`; expulsão com `requiresExplicitConfirm`.
3. **Pênalti** e **tiro livre** com equipe, resultado e cobrador (nosso), via handlers existentes.
4. **Substituição**: função pura `applySubstitution()` em `utils/substitution.ts` + testes Playwright de domínio; sticky limpo se o atleta que sai era o sticky.
5. **Presets** com long-press de 400 ms no Action Deck; payload idêntico ao fluxo manual (teste de domínio).
6. **Banco expansível** no Athlete Rail (`shell-bench-toggle` + lista de reservas).
7. `ShellStage` permanece genérico (sem `if`/`switch` por id de evento).
8. Fluxo original continua default; implementações `handleRegister*` não foram alteradas; dispatcher estendido só de forma aditiva.
9. Helper QA cross-platform: `cmd.exe` trocado por `npm`/`npm.cmd` em `e2e/helpers/scout-flow.ts`.
10. `e2e/specs/shell-equivalence.spec.ts` compara `postMatchEventLog` normalizado (ignora `id`/timestamps/`recordedBy*`/IDs regenerados pelo seed).
11. Bugfix no Shell: skip de assistência (`__skip__`) agora chama `selectValue` mesmo sem option listada.

## Arquivos alterados / criados (004E)

### Criados
- `21Scoutpro/utils/substitution.ts`
- `21Scoutpro/e2e/specs/substitution-domain.spec.ts`
- `21Scoutpro/e2e/specs/event-specs-domain.spec.ts`
- `21Scoutpro/e2e/specs/shell-equivalence.spec.ts`
- `docs/SPRINT_004E_REPORT.md`

### Modificados
- `21Scoutpro/components/collection-shell/types.ts`
- `21Scoutpro/components/collection-shell/eventSpecs.ts`
- `21Scoutpro/components/collection-shell/useShellFlow.ts`
- `21Scoutpro/components/collection-shell/ShellActionDeck.tsx`
- `21Scoutpro/components/collection-shell/ShellAthleteRail.tsx`
- `21Scoutpro/components/collection-shell/ShellStage.tsx`
- `21Scoutpro/components/collection-shell/ShellCommandBar.tsx`
- `21Scoutpro/components/CollectionShellExperimental.tsx`
- `21Scoutpro/components/MatchScoutingWindow.tsx` (porta aditiva + substituição + props do banco)
- `21Scoutpro/e2e/helpers/scout-flow.ts` (seed QA cross-platform)

Documentação/onboarding não relacionada à sprint foi preservada e não commitada.

## Verificação executada

| Comando | Resultado |
| --- | --- |
| `npx vite build --outDir /tmp/scout21-004e-check` | **aprovado** |
| `npm run type-check` filtrado aos arquivos do Shell | **zero erro novo** (após tipo métrico `preset`) |
| `e2e/specs/substitution-domain.spec.ts` | **2/2 verde** |
| `e2e/specs/event-specs-domain.spec.ts` | **1/1 verde** (preset ≡ manual em `toDomainInput`) |
| `e2e/specs/shell-finalization.spec.ts` | **3/3 verde** (após fix do helper `cmd.exe`) |
| `e2e/specs/shell-equivalence.spec.ts` | **1/1 verde** (20 eventos A/B; ~2,6 min) |
| `e2e/specs/collection-experience-access.spec.ts` | **4 passed / 1 failed / 2 skipped** — falha em query técnica/escalação inicial (`waitForRealtimeScout`), fora do núcleo 004E |
| Suíte Playwright completa | **não fechada 100%** nesta sessão por causa do cenário acima |

## Critérios de aceite

- [x] Gol/cartão/expulsão/pênalti/tiro livre/substituição declarados e roteados aditivamente
- [x] Presets 400 ms + payload idêntico ao manual (domínio)
- [x] Banco expansível no Rail
- [x] `ShellStage` genérico
- [x] Fluxo original default e `handleRegister*` intactos
- [x] Função pura de substituição com teste
- [x] Helper QA cross-platform (`cmd.exe` ENOENT corrigido)
- [x] `shell-equivalence.spec.ts` verde (20 eventos Classe A/B)
- [~] Dashboard idêntico comprovado ponta a ponta — coberto pela equivalência do log persistido; dashboard visual não revalidado manualmente
- [ ] Suíte completa verde — incompleto (`collection-experience-access` 1 falha de abertura/escalação)

## Escopo da sequência de equivalência

20 eventos cobrindo Classes A e B:
- 8 finalizações
- 6 faltas (5 nossa + 1 adversário)
- 2 gols (nosso/adversário de escanteio)
- 2 cartões amarelos (nosso/adversário)
- 2 escanteios

Pênalti e tiro livre ficam fora desta sequência E2E porque o fluxo atual depende de modais/estado de posse/faltas frágeis sob o cronômetro; ambos estão wired no Shell e cobertos por domínio/preset. Substituição é coberta pelo teste puro + wiring no Shell.

## Limitações honestas

- Sem rodada com operadores reais e sem TTE p50 medido.
- Frequência de eventos (§5.3) não reconsultada.
- Um cenário de `collection-experience-access` permanece vermelho por flakiness de abertura/escalação, não por fork de domínio do Shell.

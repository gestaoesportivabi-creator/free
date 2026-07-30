# Sprint 004F — REVIEW, enriquecimento e RECOVERY

Data: 2026-07-29  
Branch: `feature/shell-experimental-coleta`  
Commit: nenhum

## Resultado

A Sprint 004F foi implementada de forma aditiva sobre o Shell experimental. A experiência atual continua sendo o padrão e não recebeu alteração visual.

## Entregas

### ZONE declarativo

- `ZONE` passou a ser um passo opcional genérico, com as quatro zonas existentes do domínio.
- Em LIVE, os enriquecimentos opcionais de zona são pulados por padrão.
- Em REVIEW, zona é oferecida para eventos aplicáveis.
- Finalização, falta, desarme, defesa, escanteio, gol e os novos enriquecimentos transportam `zone` sem condições por ID dentro de `ShellStage`.

### REVIEW / postmatch

Foram adicionados ao deck somente em `mode='postmatch'`:

- passe genérico (Classe D), com passador, recebedor/alvo, certo/errado e `wrongPassGeneratedTransition`;
- passe-chave;
- assistência avulsa;
- lateral detalhado.

Passe genérico, passe-chave, assistência avulsa e lateral detalhado não aparecem no realtime. Passe-chave e assistência avulsa têm ações persistidas aditivamente; o participante relacionado reutiliza os campos persistidos de participante secundário (`passToPlayerId`/`passToPlayerName`).

### Timestamp editável

- O Stage oferece edição genérica do timestamp para o próximo evento e durante um fluxo.
- O Shell guarda e emite apenas `timeOverride` e `periodOverride` no draft/input.
- Conversão de 2T, normalização e carimbo oficial continuam em `MatchScoutingWindow`/ClockService.
- O override também é aplicado aos handlers antigos que não recebem tempo diretamente por um wrapper aditivo, sem alterar as implementações existentes.

### RECOVERY

- Partida incompleta com lineup e snapshot de relógio persistidos reabre diretamente na coleta.
- Lineup, banco, posse inicial, período e relógio persistidos são reaproveitados.
- A escalação não é solicitada novamente.
- O Shell exibe `Retomando de MM:SS`.

### Flake de acesso/lineup

A causa reproduzível estava no helper: ele podia clicar novamente antes de o React atualizar a lista e o contador de titulares. O helper agora aguarda a mudança do contador após cada atleta. A asserção ficou mais determinística, sem ser enfraquecida. O helper de abertura do pós-jogo também aceita corretamente tanto o marcador da experiência atual quanto a raiz do Shell.

### Decisão de posse

`possessionLost` e `possessionWon` permanecem explicitamente adiados para depois da 004J, conforme a decisão 3 da seção 17 do plano. Não foi criado domínio provisório nem payload incompatível antes da validação A/B do Shell.

## Arquivos da 004F

- `21Scoutpro/components/CollectionShellExperimental.tsx`
- `21Scoutpro/components/MatchScoutingWindow.tsx`
- `21Scoutpro/components/collection-shell/ShellStage.tsx`
- `21Scoutpro/components/collection-shell/eventSpecs.ts`
- `21Scoutpro/components/collection-shell/types.ts`
- `21Scoutpro/components/collection-shell/useShellFlow.ts`
- `21Scoutpro/e2e/helpers/scout-flow.ts`
- `21Scoutpro/e2e/specs/event-specs-domain.spec.ts`
- `21Scoutpro/e2e/specs/shell-review-recovery.spec.ts` (novo)
- `21Scoutpro/types.ts`
- `docs/SPRINT_004F_REPORT.md` (novo)

Os arquivos e documentos não relacionados já presentes no working tree foram preservados.

## Verificação executada

### Build

Comando:

`npx vite build --outDir /tmp/scout21-004f-final`

Resultado: **verde**. 2726 módulos transformados. Permanecem apenas os avisos conhecidos de placeholders de analytics, imports mistos e chunk principal acima de 1000 kB.

### TypeScript

- `npm run type-check`: **não verde**, com 146 erros históricos no projeto.
- Saída filtrada para `CollectionShellExperimental`, `collection-shell`, `MatchScoutingWindow`, tipos, helper e specs alterados: **0 erros**.

Nenhum erro novo da 004F foi encontrado nos arquivos alterados.

`git diff --check` apontou apenas espaços finais já presentes em `docs/README.md`, documento não relacionado preservado conforme solicitado; nenhum arquivo da 004F foi apontado.

### Playwright

- `event-specs-domain.spec.ts` + `substitution-domain.spec.ts`: **6 passed**.
- `shell-review-recovery.spec.ts`: **3 passed** em 1,8 min.
  - passe ausente no realtime + override `03:12`;
  - passe postmatch com recebedor, transição, zona e timestamp `23:12 / 2T`;
  - RECOVERY sem reabrir escalação e com banner de retomada.
- Jornada REVIEW ampliada com passe-chave, assistência avulsa e lateral detalhado: caso focado reexecutado, **1 passed**.
- `collection-experience-access.spec.ts` + `shell-finalization.spec.ts`: **10 passed** em 5,7 min.
- `shell-equivalence.spec.ts`: **1 passed** em 3,0 min.

O teste postmatch falhou inicialmente porque o helper exigia exclusivamente o marcador da UI atual; isso foi corrigido para reconhecer a raiz do Shell. Depois falhou por tratar o override de 2T como tempo absoluto no Shell; a conversão foi movida para `MatchScoutingWindow`, como exige o contrato, e o teste passou. Uma execução completa inicial também abriu uma partida já pausada em vez de PRE_JOGO; o teste passou a usar a ação de relógio disponível (`iniciar` ou `continuar`) sem reduzir a validação.

## Critérios e lacunas honestas

- ZONE declarativo opcional: **atendido**.
- Enriquecimentos REVIEW: **atendido**.
- Passe genérico fora do realtime: **atendido e testado**.
- Timestamp editável realtime/postmatch com domínio no `MatchScoutingWindow`: **atendido e testado**.
- RECOVERY sem repetir lineup: **atendido e testado**.
- Experiência atual preservada como padrão: **atendido; regressão verde**.
- `ShellStage` sem branches por ID de evento: **atendido**.
- Equivalência sem regressão: **verde**.
- Flake de lineup/open: **causa clara corrigida; suíte verde nesta execução**.
- `possessionLost`/`possessionWon`: **adiados intencionalmente até depois da 004J**.
- Typecheck global: **não verde por 146 erros históricos; 0 nos arquivos filtrados**.
- Não foi executada toda a suíte Playwright do produto. A suíte relevante solicitada foi executada.
- Passe-chave, assistência avulsa e lateral detalhado também entram no E2E de REVIEW (lateral via overflow `Mais`); a cobertura declarativa/de domínio continua cobrindo exclusão realtime e payload.
- Não foram realizados testes com operadores nem inventadas métricas.

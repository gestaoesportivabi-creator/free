# Sprint 004D — Motor, layout e eventos simples

Data: 2026-07-29  
Branch: `feature/shell-experimental-coleta`  
Status: implementada, sem commit

## Entregas

- Porta aditiva `registerSharedEvent()` em `MatchScoutingWindow`, roteando para os handlers existentes.
- `registerSharedFinalization()` preservado como wrapper fino.
- Motor declarativo em `eventSpecs.ts` + `useShellFlow.ts`, com sticky athlete, skip e auto-confirmação.
- Cinco zonas Deck & Rail: Command Bar, Athlete Rail, Stage genérico, Action Deck e Timeline Strip.
- Sticky athlete mantido no domínio e limpo na troca de período ou saída da quadra.
- Undo oficial do evento mais recente durante 30 segundos.
- Atalhos de teclado, overlay `?`, haptic e tick de áudio com toggle de som.
- Sete specs: Finalização (inclui trave), Falta, Desarme, Defesa, Bloqueio, Escanteio e Zona de chute.
- Auditoria `recordedByUserId`/`recordedByName` derivada da sessão autenticada.
- Guard `beforeunload`, selo visível `Shell experimental` e remoção do comentário obsoleto em `RealtimeScoutPage`.
- Fluxo original continua default e os test IDs do Shell anterior foram preservados.

## Arquitetura e invariantes

- O Shell não faz `fetch`, não monta `MatchEvent`, não calcula timestamp e não salva diretamente.
- `ShellStage.tsx` não contém condição ou `switch` por ID de evento.
- Os handlers `handleRegisterShot`, `handleRegisterFoul`, `handleRegisterTackle`, `handleRegisterSave`, `handleRegisterBlock` e `handleRegisterCorner` não tiveram suas implementações alteradas.
- O dispatcher do fluxo atual também passa pela nova porta, com a etapa pré-clock marcada como já executada para manter o comportamento anterior.
- Um novo evento declarativo exige uma entrada em `eventSpecs.ts`; o arquivo contém um comentário demonstrando a extensão sem JSX novo.
- O caminho de compatibilidade do teste anterior conserva confirmação explícita quando o fluxo começa sem sticky. O caminho normal com sticky auto-confirma no último passo.

## Verificação executada

1. `npm run build` em `21Scoutpro`: **aprovado**.
   - 2.725 módulos transformados.
   - Avisos existentes de variáveis opcionais do HTML, imports mistos e chunk principal acima de 1 MB.
2. `npx vite build --outDir /tmp/scout21-004d-build` após os ajustes finais: **aprovado**.
3. `npm run type-check`: **falhou pela dívida histórica do frontend**.
   - A saída filtrada para `CollectionShellExperimental`, `collection-shell/*`, `MatchScoutingWindow` e `RealtimeScoutPage` não retornou erro.
4. Diagnósticos do IDE nos arquivos alterados: **nenhum erro**.
5. `git diff --check`: encontrou apenas whitespace em `docs/README.md`, alteração preexistente e fora deste Sprint.
6. `shell-finalization.spec.ts`, sem alteração: **não executou os cenários**.
   - O setup falhou antes do primeiro teste com `spawnSync cmd.exe ENOENT` em `e2e/helpers/scout-flow.ts:272`.
   - Resultado: 1 falha de setup, 2 testes não iniciados.
   - O helper é específico de Windows e o ambiente desta execução é macOS.
7. Suíte Playwright completa: **não executada**, pois usa o mesmo setup bloqueado.

## Critérios de aceite

- [ ] Equivalência dos sete eventos em execução: estrutura compartilhada implementada, mas não comprovada por E2E devido ao bloqueio do helper.
- [ ] `shell-finalization.spec.ts` verde: arquivo permaneceu inalterado, porém o setup não roda no macOS.
- [ ] Suíte Playwright verde: bloqueada pelo mesmo motivo.
- [x] Zero erro novo identificado nos arquivos do Shell pelo type-check filtrado e diagnósticos do IDE.
- [x] Nenhuma implementação `handleRegister*` modificada.
- [x] `ShellStage.tsx` sem condição por ID de evento.
- [x] Extensão por uma entrada em `eventSpecs.ts` demonstrada.
- [ ] TTE p50 ≤ 1.200 ms: não medido; não houve sessão operacional válida.
- [ ] Command Bar/Stage medidos em 1366×768: Command Bar implementado com `h-14` (56 px), mas a medição visual não foi executada.

## Limitações e resultados não fabricados

- Não houve teste com operador real.
- Não foram produzidas métricas TTE, taps/evento ou preferência.
- A frequência de eventos não foi reconsultada nesta execução.
- Não foram adicionados testes unitários porque o frontend não possui runner unitário configurado; apenas Playwright está disponível.
- A fila offline e reconciliação permanecem fora da 004D, previstas para a 004G. O guard desta entrega usa o estado oficial de alterações/autosave pendentes.

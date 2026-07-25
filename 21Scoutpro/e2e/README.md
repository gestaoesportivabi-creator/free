# E2E Scout 21 PRO

## Pre-requisitos

- backend local ativo em `http://localhost:3000`
- frontend local ativo em `http://localhost:5173`
- arquivo local `21Scoutpro/.env.e2e` criado a partir de `.env.e2e.example`
- credenciais QA fora do Git

## Comandos

- `npm run test:e2e`
- `npm run test:e2e:headed`
- `npm run test:e2e:ui`
- `npm run test:e2e:report`

## Suite

- smoke autenticado da coleta
- controles principais do cronometro
- persistencia e reabertura
- compatibilidade do log compartilhado para `corner`, `card` e `goal` em `postmatch-data-entry.spec.ts`
- cleanup QA em `--dry-run`
- ciclo completo da partida com dez eventos, gol, encerramento e reabertura
- polish visual da coleta com modal interno de encerramento e rodape de eventos recentes

## Observacoes

- a suite roda em modo serial para evitar concorrencia sobre a massa QA oficial
- os testes assumem exclusivamente o ambiente QA autorizado
- nao execute cleanup real durante a Sprint 003C
- se o smoke parar na tela de login com `Credenciais invalidas`, trate como bloqueio de credencial local e nao como bug do cronometro
- se a partida QA abrir diretamente em `POS-JOGO`, os helpers oficiais rebaixam a coleta para `em_andamento` via `Salvar como incompleta` antes de reabrir o realtime
- na massa QA disponivel em `2026-07-22`, o card oficial reutilizavel reabre primeiro na janela compartilhada de coleta; por isso `postmatch-data-entry.spec.ts` valida o pipeline `MatchScoutingWindow -> postMatchEventLog -> save/reopen`, que e o mesmo gargalo arquitetural do Pos-Jogo
- os helpers tambem fecham o modal de newsletter quando ele tenta interceptar cliques da coleta
- `cleanup-dry-run.spec.ts` exige conectividade autorizada com o banco QA online
- o encerramento da partida agora passa por modal interno (`end-match-dialog`) e nao mais por dialogo nativo do navegador
- o rodape `Eventos recentes` virou ponto oficial de validacao do timestamp absoluto do gol
- quando o Vite subir em porta alternativa, defina `E2E_BASE_URL` localmente em vez de alterar os specs

# E2E Scout 21 PRO

## Pre-requisitos

- backend local ativo em `http://localhost:3000`
- frontend local ativo em `http://127.0.0.1:5173`
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
- cleanup QA em `--dry-run`
- ciclo completo da partida com dez eventos, gol, encerramento e reabertura

## Observacoes

- a suite roda em modo serial para evitar concorrencia sobre a massa QA oficial
- os testes assumem exclusivamente o ambiente QA autorizado
- nao execute cleanup real durante a Sprint 003C
- se o smoke parar na tela de login com `Credenciais invalidas`, trate como bloqueio de credencial local e nao como bug do cronometro
- se a partida QA abrir diretamente em `POS-JOGO`, os helpers oficiais rebaixam a coleta para `em_andamento` via `Guardar como incompleto` antes de reabrir o realtime
- os helpers tambem fecham o modal de newsletter quando ele tenta interceptar cliques da coleta
- `cleanup-dry-run.spec.ts` exige conectividade autorizada com o banco QA online

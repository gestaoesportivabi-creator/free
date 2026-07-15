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

## Observacoes

- a suite roda em modo serial para evitar concorrencia sobre a massa QA oficial
- os testes assumem exclusivamente o ambiente QA autorizado
- nao execute cleanup real durante a Sprint 003C
- se o smoke parar na tela de login com `Credenciais invalidas`, trate como bloqueio de credencial local e nao como bug do cronometro

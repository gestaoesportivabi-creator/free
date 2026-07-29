# Sprint 004C.1B

## Acesso digno e seleção da experiência do Shell experimental

Data: 2026-07-29
Branch: `feature/shell-experimental-coleta`

## Objetivo

Criar uma entrada clara, segura e reversível para o Shell experimental sem exigir edição manual de URL, preservando a navegação oficial:

`Login -> dashboard -> seleção da partida -> coleta`

## Solução entregue

- Preferência de experiência centralizada em `collectionExperience.ts`
- Precedência única:
  - query explícita
  - storage local
  - interface atual por padrão
- Seletor visual em `Configurações`
- URL de demonstração:
  - `/dashboard?experiencia=shell`
- Override técnico preservado:
  - `?coleta=shell`
  - `?coleta=atual`
- Shell com indicação discreta de modo ativo
- Ação acessível para retornar à interface atual
- Troca durante coleta aberta adiada para a próxima abertura

## Contrato de comportamento

### Preferência persistida

- Chave local: `SCOUT_COLLECTION_EXPERIENCE`
- Valores aceitos:
  - `current`
  - `shell`

### Resolução

1. `?coleta=shell` ou `?coleta=atual`
2. preferência persistida
3. `current`

### URL de ativação

- `?experiencia=shell` ativa a preferência local e mantém o usuário no fluxo normal
- `?experiencia=atual` restaura a interface atual
- valores inválidos são ignorados com fallback seguro

## Comportamento validado

### Fluxo manual

- `Configurações -> Experiência de coleta -> Shell experimental`
- abertura de partida QA pelo fluxo normal
- Shell aberto sem edição manual da URL
- registro de Finalização no Shell
- save como incompleta
- reabertura preservando evento e relógio
- retorno solicitado para a interface atual
- próxima abertura normal retornando ao fluxo atual

### Overrides

- `?coleta=shell` supera storage `current`
- `?coleta=atual` supera storage `shell`
- `?coleta=shell` mantém o Shell na sessão atual mesmo após o usuário alterar a preferência para `current`

## Testes executados

### Gate técnico

- frontend `build`: aprovado
- frontend `type-check`: falha por dívida histórica preexistente, sem erro novo do escopo 004C.1B
- backend `type-check`: aprovado
- `GET /health`: aprovado

### Playwright

- `collection-experience-access.spec.ts`: aprovado
- `shell-finalization.spec.ts`: aprovado
- `resume-incomplete-clock.spec.ts`: aprovado na suíte completa
- regressão crítica restante: aprovada
- suíte completa Playwright: aprovada

## Evidências

Screenshots geradas fora do Git em:

`C:\Users\Pichau\.codex\visualizations\2026\07\14\019f6184-69ff-7953-9454-68cfdf9e4cc3\shell-access-004c1b`

Arquivos:

- `01-settings-selector.png`
- `02-shell-selected.png`
- `03-shell-opened.png`
- `04-finalization-registered.png`
- `05-save-reopen.png`
- `06-return-current.png`

## Limitação conhecida

O override técnico `?coleta=shell` mantém o Shell na sessão atual mesmo após a preferência ser alterada para `current`. A mudança passa a valer na próxima abertura de coleta.

## Rollback

Para voltar ao comportamento padrão sem mexer em código:

1. abrir `Configurações`
2. selecionar `Interface atual`
3. abrir a próxima coleta normalmente

## Arquivos principais da Sprint

- `21Scoutpro/components/CollectionExperienceSelector.tsx`
- `21Scoutpro/components/Settings.tsx`
- `21Scoutpro/components/Sidebar.tsx`
- `21Scoutpro/utils/collectionExperience.ts`
- `21Scoutpro/App.tsx`
- `21Scoutpro/components/MatchScoutingWindow.tsx`
- `21Scoutpro/components/CollectionShellExperimental.tsx`
- `21Scoutpro/components/collection-shell/ShellOperationalHeader.tsx`
- `21Scoutpro/components/collection-shell/ShellStatusPanel.tsx`
- `21Scoutpro/e2e/specs/collection-experience-access.spec.ts`

# Sprint 004D.1 - Central de Ajuda e Guia Operacional do Cronometro

## Objetivo

Criar uma Central de Ajuda acessivel dentro da plataforma, com rota autenticada propria, fonte unica de conteudo e acesso contextual para o topico do cronometro.

## Estrutura entregue

- item principal `Guia de Uso` no menu lateral;
- rota autenticada `/guia-de-uso`;
- secoes:
  - Comece por aqui;
  - Cronometro da partida;
  - Registro de eventos;
  - Salvar e continuar depois;
  - Finalizar a coleta;
  - Problemas comuns;
- acesso contextual `Como usar o cronometro` dentro da coleta;
- fonte unica em `21Scoutpro/content/usageGuideContent.ts`;
- documentos Markdown editoriais.

## Decisoes

- o guia foi encaixado no fluxo autenticado atual com o menor impacto possivel em `App.tsx`;
- a rota nova reaproveita o sistema de navegacao ja existente da aplicacao;
- o painel contextual consome exatamente o mesmo topico de cronometro da fonte unica;
- o texto separa `Retomar Coleta` de `Editar Dados da partida` com base no comportamento real do produto.

## Conteudo

O cronometro cobre:

- Pre-jogo;
- Iniciar partida;
- Pausar;
- Continuar partida;
- Sincronizar cronometro;
- Encerrar coleta do 1o tempo;
- Intervalo;
- Iniciar segundo tempo;
- Encerrar partida;
- Salvar como incompleta;
- Reabrir;
- Finalizar coleta.

## Preparacao para 004D.2

A fonte unica ja organiza os passos com:

- id;
- topic;
- title;
- body;
- requiredState;
- actionLabel;
- expectedResult;
- futureTargetTestId;
- warning.

Isso deixa o conteudo pronto para um futuro tutorial interativo sem duplicar texto.

## Testes e validacoes

Data do fechamento tecnico: 6 de agosto de 2026.

Resultados confirmados nesta sprint:

- frontend `npm run build`: aprovado;
- backend `npm run type-check`: aprovado;
- backend `GET /health`: aprovado;
- spec novo `guide-access.spec.ts`: aprovado;
- regressao critica Playwright: 12/12 aprovados;
- suite Playwright completa: 15/15 aprovados.

Detalhes da regressao critica aprovada:

- `cleanup-dry-run.spec.ts`;
- `clock-controls.spec.ts`;
- `full-match-cycle.spec.ts`;
- `persistence.spec.ts`;
- `postmatch-data-entry.spec.ts`;
- `qa-smoke.spec.ts`;
- `resume-incomplete-clock.spec.ts`.

Detalhes da cobertura nova aprovada:

- `guide-access.spec.ts` valida:
  - rota autenticada `/guia-de-uso`;
  - navegacao entre topicos;
  - ausencia de segredos e placeholders no conteudo;
  - ajuda contextual do cronometro sem pausar a coleta;
  - uso em viewport de tablet horizontal.

Observacoes tecnicas:

- o `type-check` global do frontend continua com divida historica fora do escopo desta sprint;
- durante a validacao houve uma interrupcao de ambiente local com frontend e backend fora do ar;
- a falha remanescente de `persistence.spec.ts` foi confirmada como instabilidade de ambiente/abertura da coleta e estabilizada no helper E2E sem alterar o produto;
- os artefatos gerados de build e Playwright foram restaurados/removidos antes da organizacao dos commits.

## Limitacoes atuais

- esta entrega nao implementa spotlight, overlay ou tutorial guiado por etapas;
- as screenshots reais devem permanecer fora do Git, salvo se houver decisao explicita para imagens do produto;
- a revisao humana do conteudo continua importante antes da abertura do teste gratuito.

# Sprint 004D.2 - Interactive Product Tour do Cronometro

## Objetivo

Transformar a ajuda contextual do cronometro em um tour opcional, guiado e nao bloqueante dentro da tela de partida, sem alterar dominio, regras do relogio ou fluxo de persistencia.

## Escopo entregue

- o botao contextual da coleta agora abre um tour guiado em vez de um modal longo de texto;
- o tour destaca o alvo visual correspondente ao passo atual;
- o tour usa textos curtos, navegacao `Proximo`, `Voltar` e `Pular`;
- a conclusao do tour fica salva localmente no navegador;
- o guia completo da Central de Ajuda continua disponivel como referencia externa.

## Arquitetura

### Conteudo

- novo arquivo `21Scoutpro/content/clockProductTour.ts`;
- o tour monta uma sequencia segura a partir do estado atual da partida:
  - boas-vindas;
  - passo contextual do relogio;
  - selecao de atleta, quando a coleta ja permite;
  - registro de passe/evento simples, quando a coleta ja permite;
  - salvar como incompleta ou finalizar, conforme o estado atual;
  - conclusao.

### UI

- `21Scoutpro/components/guide/ClockHelpPanel.tsx` passou a renderizar o painel do tour;
- `21Scoutpro/components/MatchScoutingWindow.tsx` calcula os passos disponiveis via `useMemo`;
- o passo ativo marca o alvo com `data-tour-highlighted="true"` sem travar a tela;
- os destaques usam os controles reais da coleta, sem criar caminhos paralelos.

### Persistencia local

- chave local: `scout21.clockTour.v1.completed`;
- a chave so e gravada quando o usuario conclui o tour;
- `Pular` fecha o painel sem marcar a jornada como concluida.

## Alvos destacados no primeiro lancamento

- painel central do relogio;
- botao principal do relogio;
- sincronizacao do relogio;
- painel de selecao de atleta;
- botao `PASSE`;
- botao `Salvar como incompleta`;
- botao `Finalizar coleta`.

## Regras preservadas

- nenhum handler de cronometro foi alterado;
- nenhuma regra de pausa, sincronizacao, intervalo ou encerramento foi alterada;
- nenhum fluxo de evento foi duplicado;
- o tour apenas observa o estado atual e orienta o proximo passo operacional.

## Validacoes executadas

Data da validacao: 6 de agosto de 2026.

- frontend `npm run build`: aprovado;
- suite Playwright completa `npm run test:e2e`: aprovada;
- total de cenarios Playwright: `16/16`.

### Cobertura nova

`21Scoutpro/e2e/specs/guide-access.spec.ts` passou a validar:

- abertura do tour contextual a partir da coleta;
- adaptacao automatica do passo quando o relogio muda de `PRIMEIRO TEMPO` para `PAUSADO` e depois para `CONTINUAR PARTIDA`;
- destaque visual do alvo atual;
- ausencia de bloqueio do cronometro enquanto o painel esta aberto;
- persistencia local da conclusao do tour.

## Limitacoes deste primeiro release

- o tour prioriza a partida ja aberta e adapta a sequencia ao contexto atual;
- etapas de preparo fora da coleta aberta nao foram forcadas neste release;
- o destaque e visual, nao um spotlight com mascara total da tela;
- a experiencia foi priorizada para desktop e notebook;
- o guia completo continua sendo a referencia principal para leitura longa.

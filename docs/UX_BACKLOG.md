# UX_BACKLOG

Projeto: `SCOUT 21 PRO`
Sprint: `004A`
Data: `2026-07-23`
Escopo: catalogo de atritos, prioridades e plano recomendado para 004B.

## Resumo executivo

O problema atual nao e mais estabilidade tecnica.

O problema agora e friccao operacional.

O backlog abaixo prioriza o que mais atrasa um scout durante a coleta.

## Catalogo de atritos por gravidade

### P0 - trava velocidade ou gera erro operacional direto

| Atrito | Impacto |
| --- | --- |
| fluxo atual comeca em `atleta primeiro`, nao em `evento primeiro` | conflita com a ordem mental do scout |
| primeiro evento do realtime exige muitos cliques antes da partida realmente comecar | custo alto antes de gerar valor |
| tempo manual do pos-jogo aparece tarde | aumenta erro de memoria |
| o mesmo card pode abrir por caminhos visuais diferentes | baixa previsibilidade operacional |
| relogio pausado por evento nem sempre e obvio o bastante | risco de perder tempo real |

### P1 - desacelera e confunde

| Atrito | Impacto |
| --- | --- |
| preparacao de atletas existe em mais de uma tela | repeticao cognitiva |
| linha de botes mistura eventos simples e complexos | procura visual lenta |
| log em tabela ocupa a tela toda quando aberto | interrompe o ritmo |
| gols, faltas e bolas paradas usam fluxos diferentes demais | o usuario precisa reaprender cada lance |
| muito texto explicativo dentro do fluxo | reduz foco no clique seguinte |

### P2 - incomoda, mas e contornavel

| Atrito | Impacto |
| --- | --- |
| area livre pouco aproveitada | desperdicio de contexto tatico |
| informacoes de placar, estado e ultimos eventos disputam atencao | hierarquia visual fraca |
| `Salvar como incompleta` e `Finalizar coleta` dependem de regras internas pouco visiveis | descoberta tardia |
| modal de newsletter ainda pode interferir na navegacao | ruido externo |

### P3 - polish

| Atrito | Impacto |
| --- | --- |
| textos de botoes ainda longos em alguns pontos | peso visual |
| filtros e seletores poderiam ser mais compactos | densidade de tela |
| ausencia de atalho visual para eventos mais usados | microatrasos repetidos |

## Problemas encontrados no desenho atual

1. O sistema pede mais memoria operacional do que deveria.
2. O usuario so descobre parte das informacoes exigidas no meio do fluxo.
3. Realtime e pos-jogo compartilham motor demais na experiencia visual.
4. A area mais nobre da tela ainda nao esta dedicada ao lance atual.
5. A revisao de log compete com o registro, em vez de complementar.

## Melhorias priorizadas

### Prioridade 1

- adotar `Evento -> Atleta -> Detalhes -> Confirmar`
- explicitar tempo e periodo mais cedo
- reduzir preparacao duplicada
- criar area contextual fixa com ultimos eventos e status do relogio

### Prioridade 2

- transformar logs em painel lateral/drawer
- padronizar fluxos de gol, falta e bola parada
- unificar mensagem de estado e bloqueio do relogio

### Prioridade 3

- mini-quadra ou mapa simplificado
- atalhos operacionais de tempo no pos-jogo
- presets de eventos mais usados

## Catalogo de componentes: manter, mudar, remover

### Manter

- `useMatchClock`
- `ClockService`
- `matchUpsert`
- `matchesApi`
- contratos de `MatchEvent` e `postMatchEventLog`

### Mudar

- `ScoutTable`
- `CollectionTypeSelector`
- `MatchScoutingWindow`
- logs e edicao
- preparacao de lineup/elenco

### Reduzir ou aposentar

- `PostMatchCollectionSheet` legado
- bifurcacoes visuais repetidas
- modais grandes para eventos simples

## Riscos de migracao

| Risco | Mitigacao |
| --- | --- |
| quebrar Playwright atual | manter test ids estaveis e introduzir camada V2 com cobertura paralela |
| quebrar pos-jogo ao mexer no shell visual | preservar handlers e payload; trocar primeiro a ordem visual |
| regressao no clock | nao tocar em `ClockService` na 004B inicial |
| duplicar experiencia durante a migracao | usar feature flag e remover o velho logo apos cobertura verde |

## Plano recomendado para Sprint 004B

### Missao 1

Criar novo shell visual de coleta dentro de `MatchScoutingWindow`, sem trocar persistencia nem clock.

### Missao 2

Implementar o fluxo `Evento -> Atleta` para:

- passe
- chute
- falta

### Missao 3

Criar painel contextual fixo com:

- placar
- periodo
- clock
- ultimos eventos
- alerta de pausa

### Missao 4

Mover logs completos para modo secundario:

- drawer lateral
- tabela completa so para auditoria/edicao

### Missao 5

Atualizar Playwright para cobrir:

- abertura do novo shell
- eventos simples
- relogio
- save/reopen

### Missao 6

Trazer o fluxo do gol para o shell novo sem alterar payload.

## Definicao de pronto para 004B

1. shell novo ativo por flag ou rota controlada
2. realtime funcionando no novo fluxo para eventos simples
3. sem regressao em QA, Playwright, save/reopen ou clock
4. log antigo ainda acessivel como fallback
5. branch pronta para validacao operacional da comissao

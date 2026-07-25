# UX_BACKLOG

Projeto: `SCOUT 21 PRO`
Sprint: `004B`
Data: `2026-07-23`
Escopo: backlog operacional priorizado para a coleta hibrida.

## Resumo executivo

O backlog agora sai da camada generica de UX e entra em produto operacional.

Prioridade:

- remover perguntas desnecessarias ao vivo;
- separar claramente realtime de pos-jogo por proposito;
- preparar o Shell experimental sem tocar no dominio.

## P0 - risco de perda de dado ou fluxo impossivel

| Item | Problema | Efeito |
| --- | --- | --- |
| Ambiguidade de fluxo do card | o operador pode cair num caminho diferente sem querer | baixa previsibilidade de entrada |
| Falta de clareza do proximo passo em eventos compostos | usuario pode abandonar ou registrar errado | erro de registro |
| Dependencia visual de estados internos do clock | operador precisa interpretar o motor | fluxo trava ou desacelera |

## P1 - alto impacto operacional / erro de registro / clique duplicado

| Item | Problema | Efeito |
| --- | --- | --- |
| `Atleta -> Evento` | ordem mental invertida | custo cognitivo alto |
| Preparacao longa antes do primeiro evento | valor demora a aparecer | atraso operacional |
| Passe generico no realtime | alto volume, baixo valor imediato | distracao do jogo |
| Tempo manual tardio no pos-jogo | lembranca se degrada | erro de tempo |
| Logs como tela principal de revisao | rouba area operacional | queda de ritmo |

## P2 - excesso de etapas / baixa previsibilidade / popup longo

| Item | Problema | Efeito |
| --- | --- | --- |
| Gols, faltas e bolas paradas usam escadas diferentes | reaprendizado constante | lentidao |
| Participante secundario aparece tarde | o evento se expande no meio do fluxo | surpresa ruim |
| Falta de painel contextual fixo | estado disperso | mais olhares e retorno visual fraco |
| Muitos botoes com o mesmo peso | pouca hierarquia | procura visual lenta |

## P3 - texto / hierarquia / detalhe visual

| Item | Problema | Efeito |
| --- | --- | --- |
| Rotulos longos em alguns botoes | peso visual | leitura mais lenta |
| Alertas difusos | prioridade pouco clara | operador ignora |
| Area livre subutilizada | tela parece vazia e pouco profissional | baixa percepcao de produto |

## Decisoes de backlog desta Sprint

### Confirmado

- Passe generico nao entra no realtime principal
- Shell precisa nascer por flag
- Gol nao entra no piloto inicial do Shell
- painel contextual deve ser pequeno e permanente

### Adiado para experimento

- mini-quadra
- inferencia de sequencias
- pressao recente
- enriquecimento tatico detalhado

## Roadmap sugerido

### 004C - Infraestrutura do Shell experimental

- isolar shell visual
- criar flag
- manter fluxo atual como default
- preservar Playwright e QA

### 004D - Eventos simples

- finalizacao
- defesa
- falta
- perda de posse
- recuperacao de posse

### 004E - Eventos compostos

- gol
- penalti
- tiro livre
- cartao
- substituicao

### 004F - Painel contextual

- 4 informacoes permanentes
- 3 informacoes contextuais
- 1 alerta prioritario

### 004G - Teste A/B e decisao

- rodada QA comparativa
- metricas vs baseline
- manter, ajustar ou matar o Shell

## Itens que devem morrer se nao provarem valor

- captura de passe generico ao vivo
- fluxo que exige popup longo para evento simples
- logs full-screen como centro da operacao
- duplicidade de preparacao entre modos

## Recomendacao para 004C

Comecar pelo menor recorte que prove a tese:

1. shell novo isolado
2. eventos simples
3. painel contextual basico
4. flag explicita
5. rollback trivial

Se isso nao mostrar ganho operacional, o Shell nao deve escalar.

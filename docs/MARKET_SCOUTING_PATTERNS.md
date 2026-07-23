# MARKET_SCOUTING_PATTERNS

Projeto: `SCOUT 21 PRO`
Sprint: `004B`
Data: `2026-07-23`
Escopo: pesquisa publica de padroes de plataformas de scout e analise esportiva.

## Metodo

Criterios desta pesquisa:

- usar somente fontes publicas confiaveis;
- priorizar paginas oficiais de produto, help center e customer stories;
- separar claramente:
  - fato observado;
  - inferencia;
  - proposta para o SCOUT 21 PRO.

Observacao importante:

- nao apareceu nesta auditoria uma plataforma publica dominante e claramente focada em futsal com documentacao tao rica quanto futebol, volei, basquete ou hockey;
- por isso, os padroes de futebol e tagging ao vivo foram usados como analogia operacional mais proxima para futsal.

## Fontes observadas

### Futebol / tagging ao vivo

- Hudl Sportscode: [product page](https://www.hudl.com/products/sportscode)
- Hudl Coda: [product page](https://www.hudl.com/products/coda)
- Hudl live workflows: [webinar](https://www.hudl.com/gc/on-demand-webinar/live-data-insight-sportscode)
- Hudl livestreaming sessions: [blog](https://www.hudl.com/blog/start-livestreaming-your-live-analysis-with-hudl-sportscode)
- Nacsport real-time analysis: [official article](https://www.nacsport.com/blog/en-us/Tips/analysis-real-time)
- Nacsport Live: [product page](https://www.nacsport.com/live.php?lc=en-us)
- Spiideo live tagging help: [help center](https://support.spiideo.com/en/articles/4708322-tagging-in-spiideo-perform)
- Spiideo cloud live tagging: [customer story](https://www.spiideo.com/news/live-tagging-games-from-200-miles-away-hartford-athletic-is-analyzing-video-from-home/)
- Spiideo AutoData: [official article](https://www.spiideo.com/news/introducing-autodata-to-spiideo-perform-the-worlds-only-video-analysis-platform-with-automated-live-tagging-and-player-tracking/)

### Volei

- DataVolley 4: [product page](https://new.dataproject.com/Products/US/en/Volleyball/DataVolley4)
- Hudl Volleymetrics: [product page](https://www.hudl.com/products/volleymetrics)

### Basquete

- Genius Sports / FIBA LiveStats context: [FIBA customer story](https://www.geniussports.com/customer-stories/fiba-drives-digital-transformation/)
- Genius data capture: [data capture page](https://www.geniussports.com/data-capture/)
- Genius statistician network terms: [operator/caller model](https://statisticians.geniussports.com/index.php/terms)

### Hockey e basquete com video + dados pre-tagged

- Hudl Instat for basketball and hockey: [product page](https://instat.hudl.com/products/instat)
- Hudl Instat FAQ: [FAQ](https://www.hudl.com/products/instat/faqs)
- Hudl hockey software page: [ice hockey page](https://instat.hudl.com/sports/ice-hockey)

## Fatos observados

### 1. Plataformas maduras separam live e aprofundamento

Fato observado:

- Nacsport diz explicitamente que a analise em tempo real tende a usar um template mais basico e com menos botoes, enquanto a analise pos-jogo permite maior profundidade.
- DataVolley afirma que e possivel fazer scout em tempo real e depois completar o trabalho posteriormente.
- Spiideo diferencia live-tagging de tagging posterior e de automacao.

Leitura:

- o mercado nao trata live e post-match como o mesmo nivel de densidade.

### 2. O live privilegia poucos inputs e alto feedback

Fato observado:

- Nacsport Live enfatiza quick clip and data review em dispositivos moveis.
- Spiideo live-tagging registra tags no instante do clique e as coloca imediatamente na timeline.
- Genius/FIBA LiveStats opera com input em tempo real por operador e, em alguns contextos, com modelo caller + operator.

Leitura:

- live serve para controle e resposta rapida, nao para taxonomia profunda em todo evento.

### 3. Existem dois caminhos fortes de mercado

Fato observado:

- caminho A: tagging manual rapido com botoes customizados, como Sportscode, Coda e Nacsport;
- caminho B: captura oficial / automatizada / pre-tagged, como Genius data capture, Instat pre-tagged e Spiideo AutoData.

Leitura:

- plataformas avancadas combinam input manual seletivo com enriquecimento automatizado ou posterior.

### 4. Dados de alto volume tendem a ser reduzidos, automatizados ou terceirizados

Fato observado:

- DataVolley aceita scout detalhado de todos os toques, mas isso faz sentido num esporte com notacao especializada e teclado dedicado.
- Volleymetrics vende o ganho de ter analistas processando os toques para o staff focar em coaching.
- Hudl Instat destaca pre-tagged video e economia de tempo para scouts.

Leitura:

- quando a frequencia do evento e muito alta, a industria costuma:
  - usar teclado / notacao especializada;
  - terceirizar a coleta;
  - automatizar;
  - ou reduzir o que o operador humano precisa marcar ao vivo.

### 5. Informacao contextual sempre tem limite visual

Fato observado:

- Nacsport e Spiideo enfatizam review rapido de clips e dados;
- Sportscode + Replay e Instat + Sportscode destacam integracao de video e contexto;
- nenhuma das fontes observadas vende um dashboard de jogo ao vivo com dezenas de indicadores simultaneos para o operador principal.

Leitura:

- as interfaces mais maduras tendem a priorizar contexto rapido, nao excesso de paineis simultaneos.

## Inferencias

### 1. O futsal se parece mais com futebol em pressao cognitiva do que com volei em notacao

Inferencia:

- embora o futsal tenha alta densidade de eventos, o operador do futsal geralmente esta mais proximo de uma rotina de leitura de jogo e decisao tatica do que de uma notacao teclado-a-teclado como DataVolley.

Consequencia:

- copiar um modelo de todos os toques ao vivo nao parece adequado para um unico scout de futsal.

### 2. O melhor modelo para SCOUT 21 tende a ser hibrido

Inferencia:

- o mercado converge para:
  - captura manual curta ao vivo;
  - enriquecimento posterior;
  - automacao crescente onde fizer sentido.

Consequencia:

- a hipotese de produto aprovada para o SCOUT 21 PRO esta alinhada com o que plataformas maduras fazem.

### 3. Passe generico ao vivo tem pior relacao custo/valor

Inferencia:

- em esportes de posse, eventos muito frequentes exigem ou analistas dedicados, ou notacao muito especializada, ou automacao.

Consequencia:

- para um unico operador no futsal, passe generico ao vivo tende a custar mais do que entrega.

## Propostas para o SCOUT 21 PRO

### 1. Adotar coleta hibrida de forma explicita

Proposta:

- realtime coleta estado e contexto imediato;
- pos-jogo enriquece;
- futuro automatico infere.

### 2. Remover `Passe` do realtime principal

Proposta:

- deixar no realtime principal apenas eventos com valor tatico ou de estado mais claro;
- manter `Passe` como enriquecimento opcional no pos-jogo;
- no futuro, inferir relacoes de passe quando houver base suficiente.

### 3. Limitar o painel contextual

Proposta:

- 4 informacoes permanentes;
- 3 contextuais;
- 1 alerta prioritario.

### 4. Comecar o Shell com eventos simples

Proposta:

- finalizacao;
- falta;
- defesa.

Justificativa:

- alinham com os padroes de mercado de live tagging curto;
- sao eventos mais faceis de testar;
- evitam transformar o piloto num experimento de gol composto logo no inicio.

### 5. Tratar Gol como fluxo especial, mas curto

Proposta:

- nao virar popup longo;
- nao pedir tudo ao vivo;
- manter origem curta, assistencia opcional e enriquecimento posterior.

## Padroes de mercado resumidos

| Plataforma | Fato observado | Inferencia para SCOUT 21 |
| --- | --- | --- |
| Hudl Sportscode / Coda | coding customizado, live capture, live workflows, iPad coding | Shell precisa permitir code windows curtas e adaptaveis |
| Nacsport | template de live mais simples e review rapido | realtime deve ter menos botoes e menos profundidade |
| Spiideo | live tagging, cloud tagging e automacao de eventos | futuro do produto pode misturar tagging manual e inferencia |
| DataVolley | scout em tempo real e complemento posterior | profundidade total pode ficar no pos-jogo, nao no live |
| Volleymetrics | analistas processam dados para o staff focar em coaching | quando a captura e cara, delegar ou automatizar e melhor do que pedir tudo ao vivo |
| Genius / FIBA LiveStats | captura oficial em tempo real, operador/caller, scoreboard integration | eventos de estado precisam ser rapidos, confiaveis e sincronizados |
| Hudl Instat | video pre-tagged e estatisticas ligadas ao video | enriquecer e inferir depois pode economizar muito tempo operacional |

## Conclusao

O mercado observado aponta para a mesma direcao:

- coleta ao vivo menor e mais objetiva;
- enriquecimento posterior mais profundo;
- automacao crescendo sobre eventos de alto volume;
- interfaces de live desenhadas para velocidade, nao para completude absoluta.

Essa leitura reforca a decisao da Sprint 004B:

- o SCOUT 21 PRO deve operar como sistema hibrido;
- `Passe` generico nao deve seguir como botao principal do realtime;
- o Shell experimental deve nascer pequeno, medivel e reversivel.

# SCOUT21 — Referência Mestra Técnica e Estratégica

**Documento:** `SCOUT21_MASTER_REF.md`  
**Escopo:** Plataforma Scout21 (frontend `21Scoutpro`, backend Node/Express + PostgreSQL/Prisma), com exclusão de pastas de dependências.  
**Objetivo:** Inteligência de produto e negócio — **não** constitui proposta de alteração de código, refatoração ou instruções operacionais de desenvolvimento.

---

## 1. Resumo executivo (para sócios e investidores)

O Scout21 posiciona-se como **gestão esportiva orientada a dados**, com foco em **futsal** e na rotina do **coordenador técnico** e da **comissão**. A complexidade técnica do produto — multi-tenant por técnico/clube, modelo de partidas com estatísticas agregadas e individuais, integração com calendário competitivo, camadas de performance e bem-estar — traduz-se em três benefícios de negócio centrais:

1. **Profissionalização sem fragmentação:** substitui planilhas soltas e conversas informais por um **repositório único** de elenco, jogos e indicadores, reduzindo retrabalho e perda de informação entre treinador, preparação e gestão.

2. **Decisões com histórico:** o coordenador deixa de depender apenas da memória ou de impressões; passa a ter **séries temporais** (resultados, scout, lesões, cargas subjetivas) que sustentam escalação, períodos de transição e comunicação com diretoria e atletas.

3. **Monetização por valor percebido:** o próprio produto já segmenta experiências por **planos** (Essencial, Competição, Performance, Administrador), com **gates de funcionalidade** (por exemplo, fisiologia avançada atrelada ao nível Performance) e **landing com funil** para cadastro e upsell via WhatsApp — alinhado a modelo **SaaS B2B** com baixo atrito de entrada e expansão por módulos.

**Lucratividade:** a plataforma concentra dados que aumentam **tempo de permanência** do clube (switching cost em histórico e processos) e abre **upsell** natural (de “organizar dados” para “analisar performance e bem-estar”).  
**Retenção:** dashboards, alertas interpretativos, programação e vínculo jogo–campeonato criam **hábito de uso semanal** alinhado ao calendário real do time — fator crítico para churn baixo em software esportivo.

---

## 2. Arquitetura de valor: da entrada do scout ao dashboard

### 2.1 Problema que o fluxo resolve

O **coordenador técnico** precisa, em paralelo: preparar jogos, acompanhar elenco, cumprir calendário federativo e justificar decisões. A dor típica é **dados espalhados** (planilhas, papéis, mensagens) e **falta de linha do tempo única** entre o que aconteceu em campo e o que será decidido na semana seguinte.

### 2.2 Camadas lógicas (visão de produto)

1. **Identidade e tenant**  
   O utilizador autentica-se; o sistema associa-o a um **perfil de negócio** (técnico ou clube) e a uma ou mais **equipes**. Todas as operações de dados sensíveis respeitam esse isolamento — cada clube vê apenas o seu universo de equipes, jogadores e jogos.

2. **Cadastro e relação com o tempo**  
   **Atletas** entram no elenco com vínculo histórico à equipe; **programações** descrevem treinos e musculação ao longo das semanas; **campeonatos** e **partidas da tabela** ancoram o calendário competitivo. Isso cria o **esqueleto temporal** sobre o qual o scout e o dashboard se apoiam.

3. **Captura de performance de jogo**  
   O registo de uma **partida** pode ocorrer por vários modos complementares: planilha de dados do jogo, janela de scout em tempo real, eventos pós-jogo (log de ações com tempo e jogador), vínculo a vídeo, controlo de tempos por jogador. Os números consolidam-se em **estatísticas da equipa** e **estatísticas por jogador**, com suporte a fases de recolha e estados de partida (por exemplo, em curso ou encerrada).

4. **Persistência e síntese**  
   As partidas persistem no backend; o frontend agrega para **visão geral**: resultados recentes, artilharia, lesões no ano, próximo compromisso, foco do dia a partir da programação, alertas de suspensão e disponibilidade do plantel.

5. **Interpretação (camada “coordenador”)**  
   Além de números brutos, o produto oferece **alertas interpretativos** que combinam lesões, qualidade de sono e carga percebida (PSE) quando esses dados existem — aproximando o dashboard de um **painel de decisão** e não só de um arquivo.

### 2.3 Fecho do ciclo de valor

| Etapa | Valor para o coordenador |
|--------|-------------------------|
| Planeamento (programação + tabela) | Antecipa semana e jogos; alinha staff |
| Registo de jogo | Transforma observação em dado auditável |
| Análise (coletivo, individual, quartetos, ranking) | Compara elenco e padrões de jogo |
| Saúde / carga (conforme plano) | Reduz risco e informa retorno ao jogo |
| Dashboard | Prioriza o que importa **hoje** antes do treino ou jogo |

---

## 3. Mapeamento de entidades e relações lógicas

*(Apenas lógica de domínio — sem nomes de tabelas SQL ou estruturas de código.)*

### 3.1 Núcleo de identidade e acesso

| Entidade conceitual | Papel |
|---------------------|--------|
| **Utilizador** | Conta de acesso; liga-se a um papel na plataforma e a um plano de subscrição. |
| **Papel (função de sistema)** | Define permissões (ex.: administrador da plataforma vs utilizador de clube). |
| **Técnico** | Pessoa jurídica/natural associada ao utilizador; **dona operacional** de equipes num dos modelos de tenant. |
| **Clube** | Entidade com dados empresariais; **dona** de equipes noutro modelo de tenant. |
| **Equipe** | Unidade operacional do dia a dia: nome, categoria, temporada; pertence a um técnico ou a um clube. |

**Relações:** um utilizador liga-se a no máximo um **técnico** ou um **clube**; cada um detém **várias equipes**. O isolamento entre clientes garante que dados de uma organização não misturam com outra.

### 3.2 Elenco e saúde

| Entidade | Papel |
|----------|--------|
| **Jogador** | Pessoa atleta com dados demográficos, posição, números de camisola, cargas máximas registadas, estado (ativo, transferido). |
| **Vínculo jogador–equipe** | Histórico de períodos em que o jogador pertenceu à equipe (datas de início e fim). |
| **Lesão** | Registo por jogador: datas, tipo, localização, severidade, origem, dias afastado — suporta **histórico clínico desportivo** e decisões de retorno. |
| **Avaliação física** | Medidas antropométricas e de desempenho em datas específicas; opcionalmente plano de ação. |

**Relações:** jogadores são globais ao sistema mas **associam-se às equipes** via vínculos; lesões e avaliações **seguem o jogador** ao longo do tempo.

### 3.3 Competição e calendário

| Entidade | Papel |
|----------|--------|
| **Competição** | Catálogo de competições (ex.: nome único no sistema). |
| **Campeonato (na aplicação)** | Regras de pontuação, suspensões, fases; liga-se à equipe e contém jogos agendados. |
| **Partida da tabela de campeonato** | Linha de calendário: data, hora, adversário, competição, local, meta de desarmes, ligação opcional a uma **partida de scout** já registada. |
| **Programação semanal** | Blocos de atividades (treino, musculação, jogos) com notas e horários — alimenta “foco do dia” e chaves de bem-estar no dashboard. |

**Relações:** uma **partida de scout** pode referenciar uma competição; a **tabela de campeonato** pode apontar para essa mesma partida, alinhando **o que está planeado** com **o que foi jogado e medido**.

### 3.4 Jogo e performance

| Entidade | Papel |
|----------|--------|
| **Partida (jogo)** | Núcleo operacional: adversário, data, competição, resultado, golos, estado, fase de recolha, URL de vídeo, relações entre jogadores (ex.: duplas), convocação, histórico de substituições. |
| **Estatísticas da equipa na partida** | Agregados: remates, passes, desarmes, cartões, golos por contexto (jogo aberto / bola parada), método de golo, RPE da partida, etc. |
| **Estatísticas do jogador na partida** | Mesma granularidade ao nível individual; chave única partida+jogador. |
| **Eventos de jogo** | Marcadores temporais (minuto/segundo) por jogador e tipo de evento — base para linha do tempo e análises finas. |
| **Metas estatísticas** | Objetivos numéricos por equipe (golos, assistências, desarmes, erros de transição, etc.) para comparar **realizado vs alvo**. |

**Relações:** cada partida pertence a **uma equipe**; estatísticas e eventos **penduram** na partida e, quando aplicável, no jogador.

### 3.5 Carga, bem-estar e módulos satélite

| Entidade | Papel |
|----------|--------|
| **PSE (treino e jogo)** | Carga de esforço percebida por jogador e contexto (sessão ou jogo). |
| **PSR** | Recuperação percebida, também por treino/jogo. |
| **Qualidade de sono** | Escalas por jogador e data. |
| **Bem-estar diário** | Stress, sono, humor, dor muscular, satisfação — visão holística do dia. |
| **Controlo de tempo / minutos** | Registo de minutos jogados por jogador (ligado a relatórios e scout individual). |

**Relações:** estes módulos ligam **jogador** e **equipe** (e por vezes **partida**) e alimentam cartões de condição e alertas na visão geral.

### 3.6 Configuração e relatórios

| Entidade | Papel |
|----------|--------|
| **Definições de equipa / utilizador** | Nome de exibição, escudo — reforçam marca do clube no dashboard. |
| **Relatório gerencial** | Consome jogos, elenco, avaliações e tempos para síntese dirigida à gestão. |

---

## 4. Diferenciais técnicos (Unique Selling Points identificados no código)

Estes pontos distinguem o Scout21 de um simples registo de resultados ou de uma folha de cálculo partilhada.

1. **Multi-tenant por técnico e por clube**  
   Isolamento explícito de dados por organização, com validação de acesso à equipe e ao jogo — requisito de confiança para clubes profissionais e semiprofissionais.

2. **Scout rico e multimodal**  
   Suporte a **scout coletivo**, **individual**, **janela dedicada de partida**, **eventos pós-jogo** com tipos de ação (gol, passe, desarme, falta, defesa, etc.), zonas de quadra e auditoria de quem registou — adequado a análise tática detalhada.

3. **Índice de performance de quartetos (IPQ)**  
   Análise de **quartetos** em campo com indicadores ofensivos, defensivos e totais normalizados (0–100), com texto de método explicando o valor — forte narrativa de “inteligência de elenco”.

4. **Integração calendário competitivo ↔ partida real**  
   Tabela de campeonato com regras de **suspensão**, cartões, metas de desarme por jogo e ligação a jogos registados — útil para staff que vive regulamentos e sanções.

5. **Metas estatísticas e ranking**  
   Comparação de desempenho contra **alvos** configuráveis e **rankings** por indicadores — ancora conversas objetivas no balneário e na direção.

6. **Gestão de lesões e alertas de disponibilidade**  
   Histórico de lesões com retorno previsto/real; alertas no dashboard para atletas em recuperação e para **suspensos / pendurados** no próximo jogo.

7. **Módulo de bem-estar e fisiologia**  
   PSE, PSR, sono, bem-estar diário, avaliação física, musculação — com **segmentação por plano** (Performance) no produto, posicionando um trilho “alto valor” para departamentos médicos e de preparação.

8. **Exportação profissional para PDF**  
   Geração de PDF do scout coletivo com identidade visual (cabeçalho, gráficos, contacto comercial) — facilita **entrega a patrocinadores, diretoria ou jogadores**.

9. **API REST coesa**  
   Superfície previsível (autenticação, tenant, recursos por domínio), com competições como recurso global autenticado e restantes dados escopados por organização.

10. **Segurança e conformidade básica**  
    Cabeçalhos de segurança, CORS configurável, limites de payload para fotos em base64, políticas de linha (RLS) mencionadas nas migrações — mensagem de maturidade para compradores enterprise.

---

## 5. Análise de UX/UI: landing, jornada e conversão

### 5.1 Estrutura da landing page

A landing é **one-page** escura, com **navegação fixa** (âncoras: Para Quem É, Solução, Diferenciais, Contato), **hero** com proposta de valor (“Gestão esportiva na prática”), prova visual (mockup), secções de **problema**, **solução**, **carrossel** de imagens, **diferenciais**, narrativa “Do vestiário ao escritório”, **DNA do idealizador**, **como funciona** em cinco passos, e **contacto** com **três cartões de plano** (Grátis com CTA ativo; níveis superiores marcados como “Em breve” para gerar escassez e lista de espera).

### 5.2 Jornada do utilizador

1. **Descoberta:** entrada pelo hero ou por scroll; mensagens reforçam dados, scout e performance para futsal.  
2. **Identificação:** “Para Quem É” filtra clubes, universitários e comissões técnicas.  
3. **Prova e confiança:** carrossel, diferenciais (“criado para o futsal”, “plataforma brasileira”), história do idealizador (atleta + analista + BI).  
4. **Conversão primária:** botões **Começar Agora** e **Cadastrar Grátis** levam a **WhatsApp** com mensagem pré-preenchida — modelo **conversão assistida por humano**, comum em B2B no Brasil.  
5. **Conversão secundária:** **Login** para utilizadores existentes; **formulário de contacto** (nome, email, mensagem) com feedback “Mensagem enviada” — lead qualificado mesmo sem conversa imediata.  
6. **Conversão de upsell:** link “plano personalizado” e **FAB fixo** de WhatsApp em todas as páginas — reduz fricção para propostas enterprise.

### 5.3 Pontos de conversão (mapa rápido)

| Local | Intenção |
|-------|----------|
| Hero — Começar Agora | Alta intenção; entrada no funil comercial |
| Nav — Cadastre-se / WhatsApp | Replicado no mobile |
| Cartão Grátis — Cadastrar Grátis | Compromisso baixo; volume de topo de funil |
| Cartões Intermediário/Avançado — Em breve | Captura de interesse futuro; justifica contacto humano |
| CTA plano personalizado | Contas maiores, federações, múltiplas equipes |
| Formulário Fale conosco | Leads que preferem email |
| FAB WhatsApp flutuante | Recuperação de dúvidas em qualquer scroll |

### 5.4 Experiência pós-login (aplicação)

- **Navegação lateral hierárquica:** Gestão de Equipe, Performance, Fisiologia, mais Visão Geral e Configurações — reduz carga cognitiva.  
- **Planos:** utilizadores em plano Essencial veem **restrições de funcionalidade** (cadeados / “em breve”); utilizadores Performance desbloqueiam **fisiologia** completa — comportamento típico de **product-led growth** com upgrade explícito.  
- **Dashboard:** concentra próximo jogo, compromissos, condição do grupo, tendências e alertas — **primeira tela útil** após login, reforçando hábito.

---

## 6. Roadmap de escala comercial: cinco add-ons monetizáveis

Sugestões de **extensão de produto** vendidas como módulos ou pacotes, alinhadas ao que o domínio já prepara (dados de jogo, elenco, calendário, exportação, bem-estar):

1. **Scout com vídeo sincronizado (timeline + eventos)**  
   Monetização: licença por equipe ou por hora de vídeo armazenada. O modelo de partida já prevê URL de vídeo; o add-on seria **clipagem automática por evento** e partilha segura com staff — forte para scouting profissional e análise pós-jogo.

2. **Relatórios executivos white-label para diretoria e patrocinadores**  
   PDFs periódicos com KPIs de equipe, evolução de lesões, audiência interna (minutos por jogador) e narrativa pronta — vendido como **pacote trimestral** ou **por relatório**.

3. **API e integração com ERP / folha de pagamento / departamento médico**  
   Sincronização de atletas, estados de lesão e disponibilidade com sistemas do clube — precificação por volume de chamadas ou projeto de integração.

4. **Inteligência de adversário e benchmarking de liga**  
   Agregação anónima ou semipública de indicadores por competição (quando houver massa de dados) — **subscrição premium** para staff que prepara jogo com contexto de liga.

5. **Academia e conteúdo educativo dentro da plataforma**  
   Cursos para treinadores (metodologia de scout, leitura de quartetos, gestão de carga) com **certificado** e **cobrança por utilizador** — retém utilizadores e cria receita recorrente sem depender só de assentos de software.

---

## 7. Síntese: o Scout21 em uma frase

O Scout21 **fecha o circuito** entre **o que foi planeado** (programação e tabela), **o que aconteceu em campo** (scout e estatísticas) e **o que o staff precisa decidir amanhã** (dashboard, alertas, saúde e relatórios), com **monetização progressiva** alinhada ao valor percebido por cada tipo de clube.

---

*Documento gerado para alinhamento estratégico interno. Não substitui políticas legais, contratos com clientes ou documentação jurídica de privacidade.*

© Referência interna Scout21 — 2026

# QA ENVIRONMENT

Projeto: SCOUT 21 PRO  
Repositorio: `free`  
Branch de trabalho: `feature/cronometro-partida`  
Status atual: `BLOQUEADA AGUARDANDO AUTORIZACAO PARA MASSA DE QA`

## Finalidade do ambiente

Este documento define a massa minima recomendada para validar o cronometro e os proximos fluxos de QA sem contaminar dados reais.

No estado atual, a massa ainda nao foi criada. A Sprint 003B.2 ficou limitada ao levantamento tecnico porque nao existe autorizacao explicita registrada para alterar o banco conectado pelo backend local.

## Responsavel

- Responsavel tecnico pela analise: Codex
- Responsavel pela aprovacao de banco: nao informado

## Autorizacao

Status: ausente

Para destravar a execucao real, a autorizacao precisa definir explicitamente:
- banco ou ambiente permitido;
- tenant/clube permitido;
- usuario autorizado;
- possibilidade ou nao de executar seed;
- procedimento de exclusao dos dados;
- responsavel pela aprovacao.

Sem isso:
- nao executar seed;
- nao executar migration;
- nao criar usuario;
- nao alterar banco;
- nao tentar contornar autenticacao.

## Tenant, clube e equipe propostos

Pacote minimo recomendado:
- Tenant: `QA SCOUT 21`
- Clube: `QA Futsal Clube`
- Equipe: `QA Principal`

Regras:
- todos os registros devem ter prefixo `QA`;
- nao usar clube real;
- nao reutilizar tenant real;
- nao reaproveitar partida real.

## Usuario proposto

- Usuario: `qa.scout21@dominio-autorizado`
- Senha: nao documentar em Git nem em relatorios
- Role recomendada: `ESSENCIAL`

Justificativa:
- `ESSENCIAL` cria vinculo com `tecnico`;
- o tenant middleware exige `tecnico_id` para esse fluxo;
- e o modulo de coleta usa o escopo de equipe do tecnico.

## Atletas propostos

- `QA Atleta 01`
- `QA Atleta 02`
- `QA Atleta 03`
- `QA Atleta 04`
- `QA Atleta 05`
- `QA Atleta 06`

Regras:
- todos ficticios;
- sem nomes de pessoas reais;
- vinculados apenas a `QA Principal`.

## Partida proposta

- Adversario: `QA Adversario`
- Partida: `QA Cronometro 003B`

Campos minimos recomendados:
- equipe: `QA Principal`
- adversario: `QA Adversario`
- status inicial: `em_andamento` ou equivalente do fluxo escolhido
- `collectionPhase = 0`
- sem scout real copiado de partidas anteriores

## Procedimento de criacao

Estado atual:
- nao executado
- bloqueado por ausencia de autorizacao explicita

Ordem segura recomendada apos autorizacao:
1. Confirmar ambiente permitido e dono da aprovacao.
2. Confirmar se seed pode ou nao ser executado.
3. Preferir script especifico e idempotente:
   - `backend/scripts/seed-qa-clock.ts`
   - comando sugerido: `npm run seed:qa-clock`
4. Exigir `ALLOW_QA_SEED=true`.
5. Rodar primeiro com dry-run, se implementado.
6. Criar apenas dados com prefixo `QA`.
7. Nao imprimir senha.

## Procedimento de acesso

Estado atual:
- bloqueado

Fluxo esperado apos criacao autorizada:
1. iniciar backend local;
2. validar `GET /health`;
3. iniciar frontend local;
4. autenticar com o usuario de QA;
5. confirmar tenant e equipe corretos;
6. abrir `Dados do Jogo`;
7. localizar `QA Cronometro 003B`;
8. abrir o fluxo de coleta;
9. executar a validacao da Sprint 003B.1.

## Procedimento de limpeza

Estado atual:
- nao implementado
- nao executado

Diretriz recomendada apos autorizacao:
- criar `backend/scripts/cleanup-qa-clock.ts`;
- comando sugerido: `npm run cleanup:qa-clock`;
- exigir `ALLOW_QA_CLEANUP=true`;
- remover somente registros com prefixo `QA`;
- nunca usar filtros amplos;
- mostrar resumo antes da remocao;
- ser idempotente e falhar de forma segura.

## Scripts existentes avaliados

| Script | Papel atual | Seguro para QA online? | Observacao |
| --- | --- | --- | --- |
| `seed-roles.ts` | cria/atualiza roles base | nao sem autorizacao | idempotente, mas altera estrutura de acesso global |
| `seed-admin.ts` | cria/atualiza admin padrao | nao sem autorizacao | usa credencial fixa e mexe em usuario global |
| `seed-demo-data.ts` | popula demo ampla | nao | cria grande volume e `--clean` apaga dados do tenant tecnico |
| `seed-chopinzinho-lnf.ts` | injeta dados reais/semirreis de um tenant especifico | nao | usa IDs fixos de usuario/tecnico reais |

## Limitacoes

- nenhum seed de QA foi criado nesta Sprint;
- nenhum usuario funcional de QA foi provisionado;
- nenhum tenant de QA foi confirmado;
- nenhuma partida de QA foi criada;
- nenhuma limpeza foi executada;
- nenhuma senha deve aparecer em documentos, logs ou commits.

## Regras de uso

- proibido usar dados reais como atalho;
- proibido registrar senha em qualquer documento versionado;
- proibido executar seed sem autorizacao explicita;
- proibido usar conta `ADMINISTRADOR` generica como substituto de QA;
- proibido misturar dados de QA com tenant de clube real.

## Proibicao de dados reais

Este ambiente de QA deve ser totalmente identificavel por prefixo `QA` e isolado dos fluxos reais de coleta. Se nao for possivel garantir esse isolamento com clareza, a massa nao deve ser criada no banco atual.

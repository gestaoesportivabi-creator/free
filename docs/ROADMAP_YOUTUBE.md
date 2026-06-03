# Roadmap — YouTube Match Linker (fase futura)

Branch planejada: `feat/youtube-match-linker` (separada de `feat/coach-assistant`).

## Objetivo

Monitorar canais YouTube configurados pelo clube, localizar vídeos de jogos e associar `videoUrl` à partida em `jogos`.

## Escopo realista

| Entrega | Viabilidade |
|---------|-------------|
| Buscar novos vídeos por canal (YouTube Data API v3) | Alta |
| Filtrar por adversário, data, competição | Média |
| Vincular `videoUrl` à partida no Scout21 | Alta |
| Metadados (título, duração, thumbnail) | Alta |
| Transcrição + resumo IA (Hermes) | Média |
| Scout automático (gols, desarmes) só do vídeo | Baixa sem CV dedicado |

## Arquitetura proposta

```
YouTube Data API → watcher (VPS cron) → POST /api/assistant/youtube/match-link
                                              ↓
                                         jogos.videoUrl
                                              ↓
                              Hermes resume transcrição (opcional)
```

## Pré-requisitos

- Google Cloud project + YouTube Data API key
- Tabela `youtube_channels` (equipeId, channelId, label)
- Endpoint staff para cadastrar canais

## Fora de escopo

- Substituir scout manual ou VideoScout.tsx
- Download em massa (ToS YouTube) — preferir API oficial

## Referência no produto

- [21Scoutpro/components/VideoScout.tsx](../21Scoutpro/components/VideoScout.tsx) — já consome `videoUrl`
- Concorrentes: Once Sport (futsal video), StepOut (AI tagging)

## Quando implementar

Após `feat/coach-assistant` estável em produção com técnicos usando o bot.

const YOUTUBE_RE =
  /https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?[^\s]*v=[\w-]+|live\/[\w-]+|shorts\/[\w-]+)|youtu\.be\/[\w-]+)[^\s]*/gi;

export function extractYouTubeUrls(text: string): string[] {
  const matches = text.match(YOUTUBE_RE);
  if (!matches) return [];
  return [...new Set(matches.map((u) => u.replace(/[),.]+$/, '')))];
}

export function containsYouTubeUrl(text: string): boolean {
  return extractYouTubeUrls(text).length > 0;
}

export function enrichUserMessageForYouTubeScout(text: string): string {
  const urls = extractYouTubeUrls(text);
  if (urls.length === 0) return text;
  const url = urls[0];
  const onlyLink = text.trim() === url || text.trim().replace(/\s+/g, ' ') === url;
  if (onlyLink) {
    return `YouTube Scout PRO — recebi o link: ${url}

Use skill scout21-youtube-scout: salve o video (POST /opponents/:key/videos), busque dossie/last-match e entregue scout estruturado (placar, escalação, gols, pontos fortes/fracos, insights). Se faltar adversário, infira do último jogo ou pergunte uma vez.`;
  }
  return `${text}

[Contém link YouTube: ${url} — aplique YouTube Scout PRO: salvar video + extrair scout.]`;
}

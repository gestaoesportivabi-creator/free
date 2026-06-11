const YOUTUBE_RE =
  /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?[^\s]*v=[\w-]+|live\/[\w-]+|shorts\/[\w-]+)|youtu\.be\/[\w-]+)[^\s]*/gi;

export function ensureYoutubeUrlScheme(raw: string): string {
  const t = raw.trim();
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t.replace(/^\/\//, '')}`;
}

export function extractYouTubeUrls(text: string): string[] {
  const matches = text.match(YOUTUBE_RE);
  if (!matches) return [];
  return [...new Set(matches.map((u) => ensureYoutubeUrlScheme(u.replace(/[),.]+$/, ''))))];
}

export function containsYouTubeUrl(text: string): boolean {
  return extractYouTubeUrls(text).length > 0;
}

/** Tenta extrair nome de adversário na mesma mensagem do link */
export function extractOpponentHintFromMessage(text: string): string | undefined {
  const withoutUrl = text.replace(YOUTUBE_RE, ' ').trim();
  const patterns = [
    /(?:advers[aá]rio|vs\.?|contra|jogo\s+(?:do|de|contra))\s+([A-Za-zÀ-ú0-9][A-Za-zÀ-ú0-9\s.'-]{2,40})/i,
    /^([A-Za-zÀ-ú][A-Za-zÀ-ú\s.'-]{2,40})\s*[-–]/,
  ];
  for (const re of patterns) {
    const m = withoutUrl.match(re);
    if (m?.[1]) {
      const name = m[1].trim().replace(/\s+/g, ' ');
      if (name.length >= 3) return name;
    }
  }
  return undefined;
}

export function enrichUserMessageForYouTubeScout(text: string, contextBlock?: string): string {
  const urls = extractYouTubeUrls(text);
  if (urls.length === 0) return text;
  const url = urls[0];

  const base = `YouTube Scout PRO — link: ${url}`;

  if (contextBlock) {
    return `${base}

${contextBlock}

INSTRUCAO OBRIGATORIA: Os dados acima ja foram buscados pelo servidor Scout21. Monte o scout estruturado AGORA (placar, escalação, gols, pontos fortes/fracos, insights). PROIBIDO dizer "vou carregar skill", "aguarde" ou "carregando skill". NAO chame ferramentas neste turno.`;
  }

  return `${base}

Aplique YouTube Scout PRO. PROIBIDO dizer "vou carregar skill" — use curl/API direto (scout21-youtube-scout). Se faltar adversario, pergunte UMA vez.`;
}

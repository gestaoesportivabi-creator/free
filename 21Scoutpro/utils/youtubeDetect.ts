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

/** Normaliza links YouTube colados sem https:// */
export function normalizeMessageYoutubeUrls(text: string): string {
  const urls = extractYouTubeUrls(text);
  if (urls.length === 0) return text;
  let out = text;
  for (const url of urls) {
    const bare = url.replace(/^https?:\/\//i, '');
    out = out.replace(new RegExp(bare.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), url);
  }
  return out;
}

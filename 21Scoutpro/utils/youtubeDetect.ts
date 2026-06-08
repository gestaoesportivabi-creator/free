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

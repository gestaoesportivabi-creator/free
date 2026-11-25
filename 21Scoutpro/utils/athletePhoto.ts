/**
 * Foto do atleta fica em `foto_url` / `photoUrl` (texto: data URL ou http).
 * Não há bucket Supabase de imagens: path solto não tem URL pública nem assinada.
 */

export function athleteInitials(name: string | undefined | null): string {
  const clean = (name || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '??';
  return clean.substring(0, 2).toUpperCase();
}

/** URL utilizável em `<img src>`. Vazio, "null" ou path de storage sem host → null. */
export function athletePhotoSrc(photoUrl: string | undefined | null): string | null {
  if (photoUrl == null) return null;
  const value = String(photoUrl).trim();
  if (!value || value === 'null' || value === 'undefined') return null;

  if (value.startsWith('data:image/')) {
    const comma = value.indexOf(',');
    if (comma < 0 || value.length < comma + 8) return null;
    return value;
  }

  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('blob:') || value.startsWith('//')) return value;
  if (value.startsWith('/') && !value.startsWith('//')) return value;

  return null;
}

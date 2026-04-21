export type BlogLang = 'pt-BR' | 'en' | 'es';

/**
 * Bloco renderizável de um post. Compatível com posts antigos que usam apenas
 * `paragraphs: string[]` — nesse caso todos os blocos são tratados como `p`.
 */
export type BlogBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string; id?: string }
  | { type: 'h3'; text: string; id?: string }
  | { type: 'list'; items: string[]; ordered?: boolean }
  | { type: 'quote'; text: string; cite?: string }
  | { type: 'callout'; kind?: 'info' | 'tip' | 'warn'; title?: string; text: string }
  | { type: 'cta-newsletter'; text?: string }
  | { type: 'cta-product'; text?: string };

export interface BlogPost {
  slug: string;
  lang: BlogLang;
  title: string;
  subtitle?: string;
  date: string; // ISO YYYY-MM-DD
  updatedDate?: string;
  readMinutes: number;
  excerpt: string;
  /** Blocos estruturados — preferido. */
  blocks?: BlogBlock[];
  /** Fallback / compatibilidade: parágrafos simples. */
  paragraphs?: string[];
  /** Slug do mesmo post noutros idiomas — usado para gerar `hreflang`. */
  translations?: Partial<Record<BlogLang, string>>;
  keywords?: string[];
  author?: string;
  heroEmoji?: string;
  tags?: string[];
}

export function blocksOf(post: BlogPost): BlogBlock[] {
  if (post.blocks && post.blocks.length) return post.blocks;
  return (post.paragraphs ?? []).map((text) => ({ type: 'p' as const, text }));
}

export function tocOf(post: BlogPost): Array<{ id: string; text: string; level: 2 | 3 }> {
  const out: Array<{ id: string; text: string; level: 2 | 3 }> = [];
  for (const b of blocksOf(post)) {
    if (b.type === 'h2' || b.type === 'h3') {
      const id = b.id || slugify(b.text);
      out.push({ id, text: b.text, level: b.type === 'h2' ? 2 : 3 });
    }
  }
  return out;
}

export function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

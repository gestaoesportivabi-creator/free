export type BlogLang = 'pt-BR' | 'en' | 'es';

export interface BlogPost {
  slug: string;
  lang: BlogLang;
  title: string;
  date: string; // ISO YYYY-MM-DD
  readMinutes: number;
  excerpt: string;
  paragraphs: string[];
  /** Slug do mesmo post noutros idiomas — usado para gerar `hreflang`. */
  translations?: Partial<Record<BlogLang, string>>;
  keywords?: string[];
  author?: string;
}

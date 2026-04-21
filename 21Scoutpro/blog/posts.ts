import { POSTS_PT } from './posts.pt';
import { POSTS_EN } from './posts.en';
import { POSTS_ES } from './posts.es';
import type { BlogLang, BlogPost } from './types';

export type { BlogLang, BlogPost } from './types';

export const BLOG_POSTS_BY_LANG: Record<BlogLang, BlogPost[]> = {
  'pt-BR': POSTS_PT,
  en: POSTS_EN,
  es: POSTS_ES,
};

/** Backwards-compat: lista PT-BR. */
export const BLOG_POSTS: BlogPost[] = POSTS_PT;

export function postsForLang(lang: BlogLang): BlogPost[] {
  return BLOG_POSTS_BY_LANG[lang] ?? POSTS_PT;
}

export function getPostBySlug(slug: string, lang: BlogLang = 'pt-BR'): BlogPost | undefined {
  return postsForLang(lang).find((p) => p.slug === slug);
}

export function hreflangsForPost(post: BlogPost): Array<{ hreflang: string; path: string }> {
  const alternates: Array<{ hreflang: string; path: string }> = [];
  const langPathPrefix = (lang: BlogLang) => (lang === 'pt-BR' ? '/blog' : `/blog/${lang}`);

  alternates.push({ hreflang: post.lang === 'pt-BR' ? 'pt-BR' : post.lang, path: `${langPathPrefix(post.lang)}/${post.slug}` });
  if (post.translations) {
    (Object.entries(post.translations) as Array<[BlogLang, string]>).forEach(([lang, slug]) => {
      alternates.push({
        hreflang: lang === 'pt-BR' ? 'pt-BR' : lang,
        path: `${langPathPrefix(lang)}/${slug}`,
      });
    });
  }
  return alternates;
}

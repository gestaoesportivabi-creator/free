/**
 * SEO runtime helper: atualiza title/description/canonical/hreflang/OG a cada rota,
 * sem SSR. Bing/DuckDuckGo podem não executar JS, mas o conteúdo estático do
 * index.html garante o fallback canónico + hreflang para `/` e `/blog/{lang}`.
 */

const CANONICAL_ORIGIN = 'https://scout21.vercel.app';

type RouteMeta = {
  title: string;
  description: string;
  path: string; // absolute path, ex "/blog/en/slug"
  lang?: 'pt-BR' | 'en' | 'es';
  image?: string; // absolute URL or /path
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  alternates?: Array<{ hreflang: string; path: string }>;
};

function upsertMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string, extra: Record<string, string> = {}) {
  const key = extra.hreflang ? `[rel="${rel}"][hreflang="${extra.hreflang}"]` : `[rel="${rel}"]`;
  let el = document.head.querySelector<HTMLLinkElement>(`link${key}`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
  Object.entries(extra).forEach(([k, v]) => el!.setAttribute(k, v));
}

function removeLinks(rel: string, extra?: { hreflang?: string }) {
  const sel = extra?.hreflang
    ? `link[rel="${rel}"][hreflang="${extra.hreflang}"]`
    : `link[rel="${rel}"]`;
  document.head.querySelectorAll(sel).forEach((n) => n.remove());
}

export function applyRouteMeta(meta: RouteMeta): void {
  if (typeof document === 'undefined') return;
  const url = `${CANONICAL_ORIGIN}${meta.path}`;

  document.title = meta.title;
  if (meta.lang) document.documentElement.setAttribute('lang', meta.lang);

  upsertMeta('meta[name="description"]', 'name', 'description', meta.description);

  upsertLink('canonical', url);

  removeLinks('alternate');
  if (meta.alternates && meta.alternates.length) {
    meta.alternates.forEach((a) =>
      upsertLink('alternate', `${CANONICAL_ORIGIN}${a.path}`, { hreflang: a.hreflang }),
    );
    upsertLink('alternate', url, { hreflang: 'x-default' });
  }

  upsertMeta('meta[property="og:title"]', 'property', 'og:title', meta.title);
  upsertMeta('meta[property="og:description"]', 'property', 'og:description', meta.description);
  upsertMeta('meta[property="og:url"]', 'property', 'og:url', url);
  upsertMeta('meta[property="og:type"]', 'property', 'og:type', meta.type ?? 'website');
  if (meta.image) {
    const img = meta.image.startsWith('http') ? meta.image : `${CANONICAL_ORIGIN}${meta.image}`;
    upsertMeta('meta[property="og:image"]', 'property', 'og:image', img);
    upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', img);
  }
  if (meta.type === 'article') {
    if (meta.publishedTime)
      upsertMeta('meta[property="article:published_time"]', 'property', 'article:published_time', meta.publishedTime);
    if (meta.modifiedTime)
      upsertMeta('meta[property="article:modified_time"]', 'property', 'article:modified_time', meta.modifiedTime);
  }
  upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', meta.title);
  upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', meta.description);
}

export function injectJsonLd(id: string, data: unknown): void {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById(id);
  if (existing) existing.remove();
  const s = document.createElement('script');
  s.type = 'application/ld+json';
  s.id = id;
  s.textContent = JSON.stringify(data);
  document.head.appendChild(s);
}

export function canonicalUrl(path: string): string {
  return `${CANONICAL_ORIGIN}${path}`;
}

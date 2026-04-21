import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Calendar, Clock, Globe } from 'lucide-react';
import {
  BLOG_POSTS_BY_LANG,
  getPostBySlug,
  hreflangsForPost,
  postsForLang,
  type BlogLang,
  type BlogPost,
} from '../blog/posts';
import type { User } from '../types';
import { applyRouteMeta, canonicalUrl, injectJsonLd } from '../utils/seo';
import { onScrollPercent, track } from '../utils/analytics';
import { NewsletterTriggerButton } from './NewsletterPopup';

interface BlogPageProps {
  slug: string | null;
  lang: BlogLang;
  currentUser: User | null;
  onHome: () => void;
  onLogin: () => void;
  onOpenPost: (slug: string, lang?: BlogLang) => void;
  onChangeLang: (lang: BlogLang) => void;
  onGoToDashboard: () => void;
}

const LANG_LABEL: Record<BlogLang, string> = { 'pt-BR': 'PT', en: 'EN', es: 'ES' };
const LANG_PATH: Record<BlogLang, string> = { 'pt-BR': '/blog', en: '/blog/en', es: '/blog/es' };
const COPY = {
  'pt-BR': {
    backToBlog: 'Blog',
    backToHome: 'Início',
    blogTitle: 'Blog SCOUT21',
    blogSubtitle: 'Artigos sobre gestão de equipa, dados e rotina competitiva.',
    readMin: 'min',
    readMinFull: 'min de leitura',
    notFound: 'Artigo não encontrado.',
    allPosts: 'Ver todos os artigos',
    backTop: '← Voltar ao blog',
    leadHeadline: 'Quer testar o SCOUT21 com a sua equipa?',
    leadSub: 'Deixa o teu contacto — falamos em 24h.',
    name: 'Nome',
    email: 'E-mail',
    phone: 'WhatsApp',
    send: 'Quero saber mais',
    thanks: 'Recebido! Entramos em contacto em 24h.',
    dashboard: 'Painel',
    login: 'Login',
  },
  en: {
    backToBlog: 'Blog',
    backToHome: 'Home',
    blogTitle: 'SCOUT21 Blog',
    blogSubtitle: 'Notes on squad management, data and competitive routine.',
    readMin: 'min',
    readMinFull: 'min read',
    notFound: 'Article not found.',
    allPosts: 'See all articles',
    backTop: '← Back to blog',
    leadHeadline: 'Want to test SCOUT21 with your team?',
    leadSub: 'Leave your contact — we reply in 24h.',
    name: 'Name',
    email: 'Email',
    phone: 'WhatsApp',
    send: 'I want to know more',
    thanks: 'Got it! We reply in 24h.',
    dashboard: 'Dashboard',
    login: 'Login',
  },
  es: {
    backToBlog: 'Blog',
    backToHome: 'Inicio',
    blogTitle: 'Blog SCOUT21',
    blogSubtitle: 'Notas sobre gestión del plantel, datos y rutina competitiva.',
    readMin: 'min',
    readMinFull: 'min de lectura',
    notFound: 'Artículo no encontrado.',
    allPosts: 'Ver todos los artículos',
    backTop: '← Volver al blog',
    leadHeadline: '¿Quieres probar SCOUT21 con tu equipo?',
    leadSub: 'Dejá tu contacto — respondemos en 24h.',
    name: 'Nombre',
    email: 'Correo',
    phone: 'WhatsApp',
    send: 'Quiero saber más',
    thanks: '¡Recibido! Respondemos en 24h.',
    dashboard: 'Panel',
    login: 'Login',
  },
} as const;

export const BlogPage: React.FC<BlogPageProps> = ({
  slug,
  lang,
  currentUser,
  onHome,
  onLogin,
  onOpenPost,
  onChangeLang,
  onGoToDashboard,
}) => {
  const post: BlogPost | undefined = slug ? getPostBySlug(slug, lang) : undefined;
  const t = COPY[lang];
  const listPosts = useMemo(() => postsForLang(lang), [lang]);

  useEffect(() => {
    if (post) {
      const alternates = hreflangsForPost(post);
      const selfPath = `${LANG_PATH[post.lang]}/${post.slug}`;
      applyRouteMeta({
        title: `${post.title} — SCOUT21`,
        description: post.excerpt,
        path: selfPath,
        lang: post.lang,
        type: 'article',
        publishedTime: post.date,
        modifiedTime: post.date,
        image: '/og-cover.jpg',
        alternates,
      });
      injectJsonLd('jsonld-article', {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.excerpt,
        inLanguage: post.lang,
        datePublished: post.date,
        dateModified: post.date,
        author: { '@type': 'Organization', name: post.author ?? 'SCOUT21' },
        publisher: {
          '@type': 'Organization',
          name: 'SCOUT 21 PRO',
          logo: { '@type': 'ImageObject', url: canonicalUrl('/public-logo.png.png') },
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl(selfPath) },
        keywords: post.keywords?.join(', '),
      });
      injectJsonLd('jsonld-breadcrumb', {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: canonicalUrl('/') },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: canonicalUrl(LANG_PATH[post.lang]) },
          { '@type': 'ListItem', position: 3, name: post.title, item: canonicalUrl(selfPath) },
        ],
      });
      track('blog_view', { slug: post.slug, lang: post.lang });
      const cleanup = onScrollPercent(70, () => track('blog_read_70', { slug: post.slug, lang: post.lang }));
      return cleanup;
    }
    if (slug && !post) {
      applyRouteMeta({
        title: '404 — SCOUT21',
        description: t.notFound,
        path: LANG_PATH[lang],
        lang,
      });
      return;
    }
    const listAlternates: Array<{ hreflang: string; path: string }> = (Object.keys(BLOG_POSTS_BY_LANG) as BlogLang[]).map((l) => ({
      hreflang: l === 'pt-BR' ? 'pt-BR' : l,
      path: LANG_PATH[l],
    }));
    applyRouteMeta({
      title: `${t.blogTitle} — SCOUT21`,
      description: t.blogSubtitle,
      path: LANG_PATH[lang],
      lang,
      image: '/og-cover.jpg',
      alternates: listAlternates,
    });
    injectJsonLd('jsonld-blog', {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: t.blogTitle,
      url: canonicalUrl(LANG_PATH[lang]),
      inLanguage: lang,
      blogPost: listPosts.map((p) => ({
        '@type': 'BlogPosting',
        headline: p.title,
        url: canonicalUrl(`${LANG_PATH[lang]}/${p.slug}`),
        datePublished: p.date,
      })),
    });
  }, [slug, lang, post, listPosts, t]);

  const LangSelector = (
    <div className="flex items-center gap-1 text-xs">
      <Globe size={14} className="text-zinc-500 mr-1" aria-hidden />
      {(Object.keys(LANG_LABEL) as BlogLang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChangeLang(l)}
          className={`px-2 py-1 rounded ${
            l === lang ? 'bg-[#00f0ff] text-black font-semibold' : 'text-zinc-400 hover:text-white'
          }`}
          aria-current={l === lang ? 'true' : 'false'}
        >
          {LANG_LABEL[l]}
        </button>
      ))}
    </div>
  );

  if (slug && !post) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => onOpenPost('', lang)}
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-[#00f0ff] text-sm"
            >
              <ArrowLeft size={18} /> {t.backToBlog}
            </button>
            <img src="/public-logo.png.png" alt="SCOUT21" className="h-8 w-auto opacity-90" />
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <p className="text-zinc-400 mb-6">{t.notFound}</p>
            <button
              type="button"
              onClick={() => onOpenPost('', lang)}
              className="px-5 py-2.5 bg-[#00f0ff] text-black font-semibold rounded-lg text-sm"
            >
              {t.allPosts}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (post) {
    return (
      <div className="min-h-screen bg-black text-white">
        <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
            <button
              type="button"
              onClick={() => onOpenPost('', lang)}
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-[#00f0ff] text-sm"
            >
              <ArrowLeft size={18} /> {t.backToBlog}
            </button>
            <div className="flex items-center gap-3">
              {LangSelector}
              <NewsletterTriggerButton source="blog-post-header" />
              {currentUser ? (
                <button
                  type="button"
                  onClick={onGoToDashboard}
                  className="text-sm text-[#00f0ff] hover:underline"
                >
                  {t.dashboard}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onLogin}
                  className="text-sm px-3 py-1.5 bg-[#00f0ff] text-black font-semibold rounded-lg"
                >
                  {t.login}
                </button>
              )}
              <img src="/public-logo.png.png" alt="SCOUT21" className="h-8 w-auto" />
            </div>
          </div>
        </header>
        <article className="max-w-3xl mx-auto px-4 py-12 md:py-16">
          <p className="text-zinc-500 text-sm mb-3 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Calendar size={14} /> {post.date}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={14} /> {post.readMinutes} {t.readMin}
            </span>
          </p>
          <h1 className="landing-headline text-3xl md:text-4xl text-white mb-8 leading-tight">{post.title}</h1>
          <div className="space-y-6 landing-body text-zinc-300 text-lg leading-relaxed">
            {post.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <BlogLeadCta lang={lang} source={`blog/${post.slug}`} />
          <div className="mt-12 pt-8 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => onOpenPost('', lang)}
              className="text-[#00f0ff] hover:underline text-sm font-medium"
            >
              {t.backTop}
            </button>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onHome}
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-[#00f0ff] text-sm"
          >
            <ArrowLeft size={18} /> {t.backToHome}
          </button>
          <div className="flex items-center gap-3">
            {LangSelector}
            <NewsletterTriggerButton source="blog-list-header" />
            {currentUser ? (
              <button
                type="button"
                onClick={onGoToDashboard}
                className="text-sm text-[#00f0ff] hover:underline"
              >
                {t.dashboard}
              </button>
            ) : (
              <button
                type="button"
                onClick={onLogin}
                className="text-sm px-3 py-1.5 bg-[#00f0ff] text-black font-semibold rounded-lg"
              >
                {t.login}
              </button>
            )}
            <img src="/public-logo.png.png" alt="SCOUT21" className="h-9 w-auto" />
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-12 md:py-16">
        <div className="flex items-center gap-3 mb-10">
          <BookOpen className="text-[#00f0ff]" size={32} />
          <div>
            <h1 className="landing-headline text-3xl md:text-4xl text-white">{t.blogTitle}</h1>
            <p className="text-zinc-500 mt-1 text-sm md:text-base">{t.blogSubtitle}</p>
          </div>
        </div>
        <ul className="space-y-4">
          {listPosts.map((item) => (
            <li key={item.slug}>
              <button
                type="button"
                onClick={() => onOpenPost(item.slug, lang)}
                className="w-full text-left p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-[#00f0ff]/40 hover:bg-zinc-900/80 transition-colors"
              >
                <h2 className="text-lg md:text-xl font-semibold text-white mb-2">{item.title}</h2>
                <p className="text-zinc-400 text-sm mb-2 line-clamp-2">{item.excerpt}</p>
                <p className="text-zinc-600 text-xs">
                  {item.date} · {item.readMinutes} {t.readMinFull}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
};

interface LeadCtaProps {
  lang: BlogLang;
  source: string;
}

const BlogLeadCta: React.FC<LeadCtaProps> = ({ lang, source }) => {
  const t = COPY[lang];
  const [state, setState] = useState({ name: '', email: '', phone: '', sending: false, sent: false, error: '' });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.email.trim() || !state.name.trim()) return;
    setState((s) => ({ ...s, sending: true, error: '' }));
    try {
      track('blog_lead_submit', { source, lang });
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: state.name,
          email: state.email,
          phone: state.phone || null,
          source,
          lang,
          ua: navigator.userAgent,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setState((s) => ({ ...s, sending: false, sent: true }));
    } catch (err) {
      setState((s) => ({ ...s, sending: false, error: (err as Error).message || 'error' }));
    }
  };

  if (state.sent) {
    return (
      <aside className="mt-12 p-6 border border-[#00f0ff]/30 rounded-2xl bg-[#00f0ff]/5 text-center">
        <p className="landing-body-medium text-white">{t.thanks}</p>
      </aside>
    );
  }

  return (
    <aside className="mt-12 p-6 border border-zinc-800 rounded-2xl bg-zinc-900/40">
      <h3 className="landing-headline text-xl text-white mb-1">{t.leadHeadline}</h3>
      <p className="text-zinc-400 text-sm mb-4">{t.leadSub}</p>
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          aria-label={t.name}
          placeholder={t.name}
          required
          value={state.name}
          onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
          className="px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#00f0ff]"
        />
        <input
          aria-label={t.email}
          type="email"
          placeholder={t.email}
          required
          value={state.email}
          onChange={(e) => setState((s) => ({ ...s, email: e.target.value }))}
          className="px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#00f0ff]"
        />
        <input
          aria-label={t.phone}
          placeholder={t.phone}
          value={state.phone}
          onChange={(e) => setState((s) => ({ ...s, phone: e.target.value }))}
          className="px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#00f0ff]"
        />
        <button
          type="submit"
          disabled={state.sending}
          className="md:col-span-3 px-4 py-2.5 rounded-lg bg-[#00f0ff] hover:bg-[#00d4e6] text-black font-semibold text-sm disabled:opacity-60"
        >
          {state.sending ? '...' : t.send}
        </button>
        {state.error ? <p className="md:col-span-3 text-red-400 text-xs">{state.error}</p> : null}
      </form>
    </aside>
  );
};

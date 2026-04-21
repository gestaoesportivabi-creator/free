import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Calendar, Clock, Globe, Share2, Tag as TagIcon } from 'lucide-react';
import {
  BLOG_POSTS_BY_LANG,
  getPostBySlug,
  hreflangsForPost,
  postsForLang,
  type BlogLang,
  type BlogPost,
} from '../blog/posts';
import { blocksOf, slugify, tocOf } from '../blog/types';
import type { User } from '../types';
import { applyRouteMeta, canonicalUrl, injectJsonLd } from '../utils/seo';
import { onScrollPercent, track } from '../utils/analytics';
import { NewsletterStickyBar, NewsletterTriggerButton, openNewsletter } from './NewsletterPopup';

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
    leadHeadline: 'Quer receber um plano ideal para sua equipe?',
    leadSub: 'Deixe seu contato. Em até 24h enviamos uma proposta clara e sem compromisso.',
    name: 'Nome',
    email: 'E-mail',
    phone: 'WhatsApp',
    send: 'Quero receber minha proposta',
    thanks: 'Cadastro completo! Nosso time entra em contato em até 24h.',
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

const COVER_GRADIENTS = [
  'from-cyan-500/25 via-blue-500/15 to-indigo-500/20',
  'from-emerald-500/20 via-teal-500/15 to-cyan-500/20',
  'from-fuchsia-500/20 via-purple-500/15 to-indigo-500/25',
  'from-amber-500/20 via-orange-500/15 to-red-500/20',
  'from-sky-500/25 via-cyan-500/15 to-teal-500/20',
];

function gradientForSlug(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  return COVER_GRADIENTS[hash % COVER_GRADIENTS.length];
}

const PostCover: React.FC<{ post: BlogPost; compact?: boolean }> = ({ post, compact = false }) => {
  const gradient = gradientForSlug(post.slug);
  if (post.coverImage) {
    return (
      <div className={`relative overflow-hidden rounded-xl border border-zinc-800 ${compact ? 'mb-4 h-36' : 'mb-8 h-64 md:h-80'}`}>
        <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        {!compact && post.coverCredit && (
          <div className="absolute bottom-2 right-2 text-[10px] leading-tight text-white/70 bg-black/40 backdrop-blur-sm px-2 py-1 rounded">
            Foto:{' '}
            {post.coverCredit.photographerUrl ? (
              <a
                href={post.coverCredit.photographerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white underline-offset-2 hover:underline"
              >
                {post.coverCredit.photographer}
              </a>
            ) : (
              <span>{post.coverCredit.photographer}</span>
            )}{' '}
            · {post.coverCredit.source}
          </div>
        )}
      </div>
    );
  }
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-zinc-800 bg-gradient-to-br ${gradient} ${compact ? 'mb-4 h-36' : 'mb-8 h-64 md:h-80'}`}
      aria-label={`Capa do post ${post.title}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.1),transparent_35%)]" />
      <div className="relative flex h-full flex-col justify-end p-5 md:p-7">
        <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-zinc-200/85">SCOUT21 Blog</p>
        <p className={`${compact ? 'line-clamp-2 text-lg' : 'line-clamp-3 text-2xl md:text-3xl'} font-black leading-tight text-white`}>
          {post.title}
        </p>
      </div>
    </div>
  );
};

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
        <ReadingProgressBar />
        <PostView
          post={post}
          lang={lang}
          t={t}
          related={postsForLang(lang).filter((p) => p.slug !== post.slug).slice(0, 3)}
          onOpenPost={onOpenPost}
        />
        <NewsletterStickyBar source={`sticky_bar_${post.slug}`} />
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
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {listPosts.map((item) => (
            <li key={item.slug}>
              <button
                type="button"
                onClick={() => onOpenPost(item.slug, lang)}
                className="group h-full w-full text-left p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:border-[#00f0ff]/40 hover:bg-zinc-900/70 transition-all"
              >
                <PostCover post={item} compact />
                {item.heroEmoji ? <div className="text-2xl mb-2">{item.heroEmoji}</div> : null}
                <h2 className="text-xl md:text-2xl font-bold text-white mb-2 leading-tight group-hover:text-[#00f0ff] transition-colors">
                  {item.title}
                </h2>
                <p className="text-zinc-400 text-sm mb-4 line-clamp-3 leading-relaxed">{item.excerpt}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-1">
                    <Calendar size={12} /> {item.date}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} /> {item.readMinutes} {t.readMinFull}
                  </span>
                  {item.tags?.slice(0, 2).map((tg) => (
                    <span key={tg} className="inline-flex items-center gap-1 rounded-full bg-zinc-800/70 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-300">
                      <TagIcon size={10} /> {tg}
                    </span>
                  ))}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </main>
      <NewsletterStickyBar source="sticky_bar_blog_list" />
    </div>
  );
};

/* ============================================================================
 * Reading progress bar (fixed top)
 * ========================================================================= */
const ReadingProgressBar: React.FC = () => {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const handler = () => {
      const h = document.documentElement;
      const max = Math.max(1, h.scrollHeight - window.innerHeight);
      setPct(Math.min(100, (window.scrollY / max) * 100));
    };
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);
  return (
    <div
      aria-hidden
      className="fixed left-0 right-0 top-0 z-20 h-0.5 bg-transparent pointer-events-none"
    >
      <div
        className="h-full bg-[#00f0ff] transition-[width] duration-150 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

/* ============================================================================
 * PostView — typography, TOC, blocks, share, related
 * ========================================================================= */
interface PostViewProps {
  post: BlogPost;
  lang: BlogLang;
  t: (typeof COPY)[BlogLang];
  related: BlogPost[];
  onOpenPost: (slug: string, lang?: BlogLang) => void;
}

const PostView: React.FC<PostViewProps> = ({ post, lang, t, related, onOpenPost }) => {
  const toc = useMemo(() => tocOf(post), [post]);
  const blocks = useMemo(() => blocksOf(post), [post]);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const handleShare = async () => {
    track('blog_share_click', { slug: post.slug, lang: post.lang });
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, text: post.excerpt, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-10">
        <article className="min-w-0">
          <header className="mb-8">
            <PostCover post={post} />
            {post.heroEmoji && <div className="text-5xl mb-6" aria-hidden>{post.heroEmoji}</div>}
            <p className="text-zinc-500 text-sm mb-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <Calendar size={14} /> {post.date}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock size={14} /> {post.readMinutes} {t.readMinFull}
              </span>
              {post.author && <span>· {post.author}</span>}
            </p>
            <h1 className="landing-headline text-4xl md:text-5xl text-white mb-4 leading-[1.08] tracking-tight">
              {post.title}
            </h1>
            {post.subtitle && (
              <p className="text-lg md:text-xl text-zinc-300 leading-relaxed">{post.subtitle}</p>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:border-zinc-600"
              >
                <Share2 size={14} /> Compartilhar
              </button>
              {post.tags?.map((tg) => (
                <span
                  key={tg}
                  className="inline-flex items-center gap-1 rounded-full bg-zinc-800/70 px-3 py-1 text-[11px] uppercase tracking-wider text-zinc-300"
                >
                  <TagIcon size={11} /> {tg}
                </span>
              ))}
            </div>
          </header>

          <div className="landing-body text-zinc-200 text-[17px] md:text-[18px] leading-[1.78]">
            {blocks.map((b, i) => (
              <BlockRenderer key={i} block={b} lang={lang} postSlug={post.slug} />
            ))}
          </div>

          <BlogLeadCta lang={lang} source={`blog/${post.slug}`} />

          {related.length > 0 && (
            <section className="mt-16 pt-10 border-t border-zinc-800">
              <h2 className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-6">Leia também</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {related.map((r) => (
                  <button
                    key={r.slug}
                    type="button"
                    onClick={() => onOpenPost(r.slug, lang)}
                    className="group text-left p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-[#00f0ff]/40 transition-colors"
                  >
                    {r.heroEmoji && <div className="text-2xl mb-3" aria-hidden>{r.heroEmoji}</div>}
                    <h3 className="font-semibold text-white mb-2 leading-snug group-hover:text-[#00f0ff] transition-colors">
                      {r.title}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {r.readMinutes} {t.readMinFull}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          )}

          <div className="mt-12 pt-6 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => onOpenPost('', lang)}
              className="text-[#00f0ff] hover:underline text-sm font-medium"
            >
              {t.backTop}
            </button>
          </div>
        </article>

        {toc.length > 0 && (
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <p className="text-zinc-500 text-[11px] uppercase tracking-[0.2em] mb-3">Nesta página</p>
              <nav className="space-y-2">
                {toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`block text-sm text-zinc-400 hover:text-[#00f0ff] transition-colors ${
                      item.level === 3 ? 'pl-3 text-[13px]' : ''
                    }`}
                  >
                    {item.text}
                  </a>
                ))}
              </nav>
              <div className="mt-8 p-4 rounded-xl border border-[#00f0ff]/30 bg-[#00f0ff]/5">
                <p className="text-[11px] uppercase tracking-wider text-[#00f0ff] mb-1">Newsletter</p>
                <p className="text-xs text-zinc-300 leading-relaxed mb-3">
                  1 artigo por semana — casos reais de futsal.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    track('newsletter_button_click', { source: 'blog-toc-sidebar' });
                    openNewsletter();
                  }}
                  className="w-full rounded-lg bg-[#00f0ff] px-3 py-2 text-xs font-semibold uppercase tracking-wider text-black hover:bg-[#00d4e6]"
                >
                  Assinar
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
 * BlockRenderer — renderiza cada bloco com tipografia forte
 * ========================================================================= */
const BlockRenderer: React.FC<{
  block: ReturnType<typeof blocksOf>[number];
  lang: BlogLang;
  postSlug: string;
}> = ({ block, lang, postSlug }) => {
  switch (block.type) {
    case 'p':
      return <p className="my-5">{block.text}</p>;
    case 'h2':
      return (
        <h2
          id={block.id || slugify(block.text)}
          className="mt-12 mb-4 scroll-mt-24 text-2xl md:text-3xl font-bold text-white tracking-tight"
        >
          {block.text}
        </h2>
      );
    case 'h3':
      return (
        <h3
          id={block.id || slugify(block.text)}
          className="mt-8 mb-3 scroll-mt-24 text-xl md:text-2xl font-semibold text-white tracking-tight"
        >
          {block.text}
        </h3>
      );
    case 'list': {
      const Tag = block.ordered ? 'ol' : 'ul';
      return (
        <Tag
          className={`my-6 space-y-2 ${block.ordered ? 'list-decimal' : 'list-disc'} pl-6 marker:text-[#00f0ff]`}
        >
          {block.items.map((item, i) => (
            <li key={i} className="leading-relaxed">
              {item}
            </li>
          ))}
        </Tag>
      );
    }
    case 'quote':
      return (
        <blockquote className="my-8 border-l-4 border-[#00f0ff]/60 bg-zinc-900/40 px-5 py-4 rounded-r-lg italic text-zinc-200">
          <p className="mb-1">“{block.text}”</p>
          {block.cite && <cite className="not-italic text-xs text-zinc-500">— {block.cite}</cite>}
        </blockquote>
      );
    case 'callout': {
      const tone =
        block.kind === 'warn'
          ? 'border-amber-500/40 bg-amber-500/10 text-amber-100'
          : block.kind === 'tip'
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100'
          : 'border-[#00f0ff]/40 bg-[#00f0ff]/10 text-zinc-100';
      return (
        <div className={`my-6 rounded-xl border p-5 ${tone}`}>
          {block.title && <p className="font-semibold mb-1">{block.title}</p>}
          <p className="text-[15px] leading-relaxed opacity-95">{block.text}</p>
        </div>
      );
    }
    case 'cta-newsletter':
      return (
        <div className="my-10 rounded-2xl border border-[#00f0ff]/30 bg-gradient-to-br from-[#00f0ff]/10 to-transparent p-6 md:p-8 text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#00f0ff] mb-2">Newsletter SCOUT21</p>
          <p className="text-lg md:text-xl font-semibold text-white mb-2 leading-snug">
            {block.text || 'Gosta do que está a ler? Recebe 1 artigo por semana.'}
          </p>
          <p className="text-sm text-zinc-400 mb-5">Casos reais, sem spam. Cancele quando quiser.</p>
          <button
            type="button"
            onClick={() => {
              track('newsletter_button_click', { source: `blog-inline-${postSlug}` });
              openNewsletter();
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-[#00f0ff] px-6 py-3 text-sm font-semibold uppercase tracking-wider text-black hover:bg-[#00d4e6]"
          >
            Quero assinar
          </button>
        </div>
      );
    case 'cta-product':
      return (
        <div className="my-10 rounded-2xl border border-zinc-700 bg-zinc-900/60 p-6 md:p-8">
          <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 mb-2">SCOUT 21 PRO</p>
          <p className="text-lg md:text-xl font-semibold text-white mb-2 leading-snug">
            {block.text || 'Coloque isto em prática com a plataforma completa.'}
          </p>
          <p className="text-sm text-zinc-400 mb-5">
            Scout estruturado, fisiologia, calendário e relatório gerencial — tudo num banco único.
          </p>
          <a
            href="/"
            onClick={() => track('blog_product_cta', { source: postSlug, lang })}
            className="inline-flex items-center gap-2 rounded-lg border border-[#00f0ff] px-6 py-3 text-sm font-semibold uppercase tracking-wider text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black transition-colors"
          >
            Testar o SCOUT 21
          </a>
        </div>
      );
    default:
      return null;
  }
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

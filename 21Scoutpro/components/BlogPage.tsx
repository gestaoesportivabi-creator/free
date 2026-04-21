import React from 'react';
import { ArrowLeft, BookOpen, Calendar, Clock } from 'lucide-react';
import { BLOG_POSTS, getPostBySlug, type BlogPost } from '../blog/posts';
import type { User } from '../types';

interface BlogPageProps {
  slug: string | null;
  currentUser: User | null;
  onHome: () => void;
  onLogin: () => void;
  onOpenPost: (slug: string) => void;
  onGoToDashboard: () => void;
}

export const BlogPage: React.FC<BlogPageProps> = ({
  slug,
  currentUser,
  onHome,
  onLogin,
  onOpenPost,
  onGoToDashboard,
}) => {
  const post: BlogPost | undefined = slug ? getPostBySlug(slug) : undefined;

  if (slug && !post) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => {
                onOpenPost('');
              }}
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-[#00f0ff] text-sm"
            >
              <ArrowLeft size={18} /> Blog
            </button>
            <img src="/public-logo.png.png" alt="SCOUT21" className="h-8 w-auto opacity-90" />
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <p className="text-zinc-400 mb-6">Artigo não encontrado.</p>
            <button
              type="button"
              onClick={() => onOpenPost('')}
              className="px-5 py-2.5 bg-[#00f0ff] text-black font-semibold rounded-lg text-sm"
            >
              Ver todos os artigos
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
              onClick={() => onOpenPost('')}
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-[#00f0ff] text-sm"
            >
              <ArrowLeft size={18} /> Blog
            </button>
            <div className="flex items-center gap-3">
              {currentUser ? (
                <button
                  type="button"
                  onClick={onGoToDashboard}
                  className="text-sm text-[#00f0ff] hover:underline"
                >
                  Painel
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onLogin}
                  className="text-sm px-3 py-1.5 bg-[#00f0ff] text-black font-semibold rounded-lg"
                >
                  Login
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
              <Clock size={14} /> {post.readMinutes} min
            </span>
          </p>
          <h1 className="landing-headline text-3xl md:text-4xl text-white mb-8 leading-tight">{post.title}</h1>
          <div className="space-y-6 landing-body text-zinc-300 text-lg leading-relaxed">
            {post.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <div className="mt-12 pt-8 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => onOpenPost('')}
              className="text-[#00f0ff] hover:underline text-sm font-medium"
            >
              ← Voltar ao blog
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
            <ArrowLeft size={18} /> Início
          </button>
          <div className="flex items-center gap-3">
            {currentUser ? (
              <button
                type="button"
                onClick={onGoToDashboard}
                className="text-sm text-[#00f0ff] hover:underline"
              >
                Painel
              </button>
            ) : (
              <button
                type="button"
                onClick={onLogin}
                className="text-sm px-3 py-1.5 bg-[#00f0ff] text-black font-semibold rounded-lg"
              >
                Login
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
            <h1 className="landing-headline text-3xl md:text-4xl text-white">Blog SCOUT21</h1>
            <p className="text-zinc-500 mt-1 text-sm md:text-base">
              Artigos sobre gestão de equipa, dados e rotina competitiva.
            </p>
          </div>
        </div>
        <ul className="space-y-4">
          {BLOG_POSTS.map((item) => (
            <li key={item.slug}>
              <button
                type="button"
                onClick={() => onOpenPost(item.slug)}
                className="w-full text-left p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-[#00f0ff]/40 hover:bg-zinc-900/80 transition-colors"
              >
                <h2 className="text-lg md:text-xl font-semibold text-white mb-2">{item.title}</h2>
                <p className="text-zinc-400 text-sm mb-2 line-clamp-2">{item.excerpt}</p>
                <p className="text-zinc-600 text-xs">
                  {item.date} · {item.readMinutes} min de leitura
                </p>
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
};

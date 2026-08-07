/**
 * Shell público — landing, cadastro, login, blog e legais.
 * Carrega sem o bundle do dashboard (App.tsx). Após login/signup,
 * navega para /dashboard ou /bem-vindo para hidratar o app autenticado.
 */
import React, { useCallback, useEffect, useState, Suspense, lazy } from 'react';
import type { User } from './types';
import type { BlogLang } from './blog/types';
import { applyRouteMeta } from './utils/seo';
import { trackPageView } from './utils/analytics';

const LandingPage = lazy(() =>
  import('./components/LandingPage').then((m) => ({ default: m.LandingPage }))
);
const SignUp = lazy(() => import('./components/SignUp').then((m) => ({ default: m.SignUp })));
const Login = lazy(() => import('./components/Login').then((m) => ({ default: m.Login })));
const LegalPage = lazy(() =>
  import('./components/legal/LegalPage').then((m) => ({ default: m.LegalPage }))
);
const BlogPage = lazy(() => import('./components/BlogPage').then((m) => ({ default: m.BlogPage })));
const AuthEmailAction = lazy(() =>
  import('./components/AuthEmailAction').then((m) => ({ default: m.AuthEmailAction }))
);

type PublicRoute = 'landing' | 'login' | 'signup' | 'blog' | 'legal';

function normalizePathname(): string {
  return window.location.pathname.replace(/\/$/, '') || '/';
}

function matchBlogPath(p: string): { lang: BlogLang; slug: string | null } | null {
  const m = p.match(/^\/blog(?:\/(en|es))?(?:\/([^/]+))?$/);
  if (!m) return null;
  const langFromUrl = m[1];
  const maybeSlug = m[2];
  const lang: BlogLang = langFromUrl === 'en' ? 'en' : langFromUrl === 'es' ? 'es' : 'pt-BR';
  return { lang, slug: maybeSlug || null };
}

function matchLegalPath(p: string): 'terms' | 'privacy' | null {
  if (p === '/termos' || p === '/termos-de-uso') return 'terms';
  if (p === '/privacidade' || p === '/politica-de-privacidade') return 'privacy';
  return null;
}

function matchAuthEmailPath(p: string): { kind: 'reset-password' | 'magic-link' | 'verify-email'; token: string } | null {
  const m = p.match(/^\/login\/(reset-password|magic-link|verify-email)$/);
  if (!m) return null;
  const token = new URLSearchParams(window.location.search).get('token');
  if (!token) return null;
  return { kind: m[1] as 'reset-password' | 'magic-link' | 'verify-email', token };
}

const SIGNUP_PATHS = ['/criar-conta', '/cadastro', '/signup'];

function getInitialRoute(): PublicRoute {
  const p = normalizePathname();
  if (matchBlogPath(p)) return 'blog';
  if (matchLegalPath(p)) return 'legal';
  if (SIGNUP_PATHS.includes(p)) return 'signup';
  if (p === '/login' || matchAuthEmailPath(p)) return 'login';
  return 'landing';
}

function blogPathFor(lang: BlogLang, slug?: string | null): string {
  const base = lang === 'pt-BR' ? '/blog' : `/blog/${lang}`;
  return slug ? `${base}/${slug}` : base;
}

const Fallback = () => (
  <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 text-sm">
    Carregando…
  </div>
);

export function PublicApp() {
  const [route, setRoute] = useState<PublicRoute>(getInitialRoute);
  const [legalDoc, setLegalDoc] = useState<'terms' | 'privacy'>(
    () => matchLegalPath(normalizePathname()) ?? 'terms'
  );
  const [blogSlug, setBlogSlug] = useState<string | null>(
    () => matchBlogPath(normalizePathname())?.slug ?? null
  );
  const [blogLang, setBlogLang] = useState<BlogLang>(
    () => matchBlogPath(normalizePathname())?.lang ?? 'pt-BR'
  );

  const goDashboard = useCallback(() => {
    window.location.assign('/dashboard');
  }, []);

  const goWelcome = useCallback(() => {
    window.location.assign('/bem-vindo');
  }, []);

  useEffect(() => {
    const onPop = () => setRoute(getInitialRoute());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    if (route === 'blog') {
      applyRouteMeta({
        title: blogSlug ? `Blog — SCOUT21` : 'Blog — SCOUT21',
        description: 'Artigos sobre gestão e performance no futsal.',
        path: blogPathFor(blogLang, blogSlug),
      });
      trackPageView(blogPathFor(blogLang, blogSlug));
      return;
    }
    if (route === 'signup') {
      window.history.replaceState({}, '', '/criar-conta');
      trackPageView('/criar-conta');
      return;
    }
    if (route === 'legal') {
      const path = legalDoc === 'terms' ? '/termos' : '/privacidade';
      trackPageView(path);
      return;
    }
    if (route === 'login') {
      if (!matchAuthEmailPath(normalizePathname())) {
        window.history.replaceState({}, '', '/login');
      }
      trackPageView('/login');
      return;
    }
    window.history.replaceState({}, '', '/');
    trackPageView('/');
  }, [route, blogSlug, blogLang, legalDoc]);

  return (
    <Suspense fallback={<Fallback />}>
      {route === 'blog' ? (
        <BlogPage
          slug={blogSlug}
          lang={blogLang}
          currentUser={null}
          onHome={() => {
            setRoute('landing');
            window.history.pushState({}, '', '/');
          }}
          onLogin={() => {
            setRoute('login');
            window.history.pushState({}, '', '/login');
          }}
          onOpenPost={(next, lang) => {
            const nextLang = (lang ?? blogLang) as BlogLang;
            setBlogSlug(next);
            setBlogLang(nextLang);
            setRoute('blog');
            window.history.pushState({}, '', blogPathFor(nextLang, next));
          }}
          onChangeLang={(lang) => {
            setBlogLang(lang);
            setBlogSlug(null);
            setRoute('blog');
            window.history.pushState({}, '', blogPathFor(lang));
          }}
          onGoToDashboard={() => {
            if (localStorage.getItem('token')) goDashboard();
            else {
              setRoute('login');
              window.history.pushState({}, '', '/login');
            }
          }}
        />
      ) : null}

      {route === 'legal' ? (
        <LegalPage
          document={legalDoc}
          onBack={() => {
            setRoute('landing');
            window.history.pushState({}, '', '/');
          }}
        />
      ) : null}

      {route === 'signup' ? (
        <SignUp
          onSignedUp={(_user: User) => goWelcome()}
          onGoToLogin={() => {
            setRoute('login');
            window.history.pushState({}, '', '/login');
          }}
          onBackToHome={() => {
            setRoute('landing');
            window.history.pushState({}, '', '/');
          }}
        />
      ) : null}

      {route === 'login' ? (
        (() => {
          const authEmail = matchAuthEmailPath(normalizePathname());
          if (authEmail) {
            return (
              <AuthEmailAction
                kind={authEmail.kind}
                token={authEmail.token}
                onLogin={() => goDashboard()}
                onBackToLogin={() => {
                  setRoute('login');
                  window.history.pushState({}, '', '/login');
                }}
              />
            );
          }
          return (
            <Login
              onLogin={(_user) => goDashboard()}
              onBackToHome={() => {
                setRoute('landing');
                window.history.pushState({}, '', '/');
              }}
              onSwitchToRegister={() => {
                setRoute('signup');
                window.history.pushState({}, '', '/criar-conta');
              }}
            />
          );
        })()
      ) : null}

      {route === 'landing' ? (
        <LandingPage
          onGetStarted={() => {
            setRoute('signup');
            window.history.pushState({}, '', '/criar-conta');
          }}
          onGoToLogin={() => {
            setRoute('login');
            window.history.pushState({}, '', '/login');
          }}
          onGoToSignup={() => {
            setRoute('signup');
            window.history.pushState({}, '', '/criar-conta');
          }}
        />
      ) : null}
    </Suspense>
  );
}

import type { MouseEvent } from 'react';

export const scrollToSection = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
  e.preventDefault();
  const id = href.slice(1);
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
};

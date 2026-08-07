import React from 'react';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  title,
  subtitle,
  align = 'center',
}) => (
  <div className={`mb-12 md:mb-16 ${align === 'center' ? 'text-center' : 'text-left'}`}>
    {eyebrow ? (
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#00f0ff] mb-3">
        {eyebrow}
      </p>
    ) : null}
    <h2 className="landing-headline text-3xl md:text-5xl text-white leading-tight">{title}</h2>
    <div
      className={`mt-4 h-1 w-20 bg-[#00f0ff] ${align === 'center' ? 'mx-auto' : ''}`}
      aria-hidden
    />
    {subtitle ? (
      <p className="landing-body-medium mt-6 text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
        {subtitle}
      </p>
    ) : null}
  </div>
);

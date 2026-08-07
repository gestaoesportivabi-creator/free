import React from 'react';

interface ScreenshotFrameProps {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
  caption?: string;
}

export const ScreenshotFrame: React.FC<ScreenshotFrameProps> = ({
  src,
  alt,
  priority = false,
  className = '',
  caption,
}) => (
  <figure className={`relative ${className}`}>
    <div className="overflow-hidden border border-zinc-700/80 bg-zinc-950">
      <img
        src={src}
        alt={alt}
        className="w-full h-auto object-cover object-top"
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        {...(priority ? { fetchPriority: 'high' as const } : {})}
      />
    </div>
    {caption ? (
      <figcaption className="mt-3 text-xs text-zinc-500 landing-body">{caption}</figcaption>
    ) : null}
  </figure>
);

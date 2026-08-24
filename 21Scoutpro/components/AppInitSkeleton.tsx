import React from 'react';

interface AppInitSkeletonProps {
  message?: string;
}

/**
 * Branded loading shell shown while auth/routes initialize on first access.
 */
export const AppInitSkeleton: React.FC<AppInitSkeletonProps> = ({
  message = 'Preparando seu elenco…',
}) => (
  <div
    className="min-h-screen bg-black text-white flex items-center justify-center p-6"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <div className="w-full max-w-md space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-28 rounded bg-zinc-800 animate-pulse" />
          <div className="h-2 w-40 rounded bg-zinc-900 animate-pulse" />
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 space-y-2">
              <div className="h-2 w-12 rounded bg-zinc-800 animate-pulse" />
              <div className="h-5 w-8 rounded bg-zinc-700 animate-pulse" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="h-2 w-full rounded bg-zinc-800 animate-pulse" />
          <div className="h-2 w-5/6 rounded bg-zinc-900 animate-pulse" />
          <div className="h-2 w-2/3 rounded bg-zinc-900 animate-pulse" />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
        <div className="h-2 w-32 rounded bg-zinc-800 animate-pulse" />
        <div className="h-16 rounded-lg bg-zinc-900/80 border border-zinc-800 animate-pulse" />
      </div>

      <p className="text-center text-sm text-zinc-400">{message}</p>
    </div>
  </div>
);

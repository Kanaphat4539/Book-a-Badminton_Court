'use client';

import type { ReactNode } from 'react';

/**
 * Reusable sporty edge-to-edge banner.
 * Shared visual language across every page: brand gradient (dark-aware),
 * spinning court ring, drifting accent orb, twinkling sparks and status pill.
 */

export type SportBannerProps = {
  /** Pill shown above the title (e.g. status). Rendered with a pulsing signal dot. */
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Row of small info chips under the subtitle. */
  meta?: ReactNode[];
  /** Right-hand side content (quota card / action button). */
  right?: ReactNode;
  /** Optional top-right control (e.g. Users button / role badge). */
  topRight?: ReactNode;
  /** Optional top-left brand row (icon box + label). */
  leading?: ReactNode;
  /** Extra padding override for the content area. */
  contentClassName?: string;
  className?: string;
};

export default function SportBanner({
  eyebrow,
  title,
  subtitle,
  meta,
  right,
  topRight,
  leading,
  contentClassName = 'px-6 md:px-10 py-10 md:py-12',
  className = '',
}: SportBannerProps) {
  return (
    <section
      className={`relative w-full overflow-hidden bg-gradient-to-r from-[#FF6B22] via-[#F2570C] to-[#A43A00] dark:from-[#A03A00] dark:via-[#7A2800] dark:to-[#471400] shadow-[0_14px_36px_-18px_rgba(242,101,34,0.55)] ${className}`}
    >
      {/* animated brand gradient (same palette, slowly moving) */}
      <div
        className="animate-sport-gradient absolute inset-0 opacity-80 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(115deg, #FF6B22 0%, #F2570C 28%, #E85A10 52%, #F26522 74%, #A43A00 100%)',
        }}
      />
      <div
        className="animate-sport-gradient absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(60deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0.10) 70%, rgba(255,255,255,0) 100%)',
          animationDirection: 'reverse',
          animationDuration: '22s',
        }}
      />

      {/* floating concentric rings (lower-left depth) */}
      <div className="animate-sport-ring absolute -left-14 -bottom-24 w-64 h-64 rounded-full border-[18px] border-white/10 dark:border-white/5 pointer-events-none" />
      <div className="animate-sport-ring absolute left-6 -bottom-16 w-40 h-40 rounded-full border-[10px] border-white/10 dark:border-white/5 pointer-events-none" style={{ animationDelay: '1.1s' }} />

      {/* subtle court-line grid */}
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(255,255,255,0.5) 1.5px, transparent 1.5px)',
          backgroundSize: '46px 46px',
        }}
      />
      {/* center court line */}
      <svg className="absolute inset-x-0 top-0 h-40 w-full opacity-10" viewBox="0 0 1440 160" preserveAspectRatio="none" fill="none">
        <path d="M200 160 L200 10 M1240 160 L1240 10 M720 160 L720 0" stroke="#fff" strokeWidth="2" />
      </svg>

      {/* glow blobs */}
      <div className="animate-sport-drift absolute -right-16 -top-16 w-72 h-72 rounded-full bg-white/20 dark:bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-24 w-80 h-80 rounded-full bg-black/15 dark:bg-black/35 blur-3xl pointer-events-none" />

      {/* spinning court ring */}
      <div className="animate-sport-spin-slow absolute -right-24 top-1/2 -translate-y-1/2 w-[560px] h-[560px] rounded-full border-2 border-dashed border-white/15 dark:border-white/10 pointer-events-none" />

      {/* twinkling sparks */}
      <span className="animate-sport-twinkle absolute left-[12%] top-6 text-white/70 text-sm" style={{ animationDelay: '0.4s' }}>✦</span>
      <span className="animate-sport-twinkle absolute left-[28%] bottom-8 text-white/50 text-lg" style={{ animationDelay: '1.6s' }}>✦</span>
      <span className="animate-sport-twinkle absolute right-[22%] top-7 text-white/60 text-sm" style={{ animationDelay: '0.9s' }}>✦</span>

      {/* sheen sweep (periodic light reflection) */}
      <div
        className="animate-sport-shine absolute top-[-30%] bottom-[-30%] left-0 w-24 md:w-32 z-10 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0) 100%)',
        }}
      />

      {/* accent orb (kept, mascot removed by request) */}
      <div className="absolute right-6 md:right-14 top-1/2 -translate-y-1/2 w-28 md:w-40 opacity-50 md:opacity-70 pointer-events-none">
        <div className="animate-sport-drift w-full aspect-square rounded-full bg-white/15 dark:bg-white/10 ring-2 ring-white/20 dark:ring-white/10 backdrop-blur-[2px] flex items-center justify-center">
          <span className="material-symbols-outlined text-[44px] md:text-[56px] text-white/85">sports_tennis</span>
        </div>
      </div>

      <div className={`relative z-20 mx-auto max-w-7xl ${contentClassName}`}>
        {(leading || topRight) && (
          <div className="flex items-center justify-between gap-3 mb-5">
            {leading}
            {topRight}
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pr-0 md:pr-8">
          <div className="max-w-[92%] md:max-w-3xl min-w-0">
            {eyebrow && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white border border-white/25 backdrop-blur-md w-fit mb-3 shadow-inner dark:bg-white/10 dark:border-white/15">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_#4ade80]" />
                <span className="font-label-sm text-[10px] md:text-label-sm uppercase tracking-widest font-black">{eyebrow}</span>
              </div>
            )}
            <h1 className="font-headline-sm text-3xl md:text-[40px] text-white font-extrabold leading-tight drop-shadow-md">
              {title}
            </h1>
            {subtitle && (
              <div className="font-body-sm text-[14px] md:text-[16px] text-white/90 mt-3 flex items-center gap-2 min-w-0">
                {subtitle}
              </div>
            )}
            {meta && meta.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {meta.map((chip, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur-sm dark:bg-white/10">
                    {chip}
                  </span>
                ))}
              </div>
            )}
          </div>

          {right && <div className="shrink-0 min-w-0">{right}</div>}
        </div>
      </div>
    </section>
  );
}
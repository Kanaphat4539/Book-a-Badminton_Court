'use client';

import React, { useId } from 'react';
import { useLocale } from '@/components/locale-provider';
import { cn } from '@/lib/utils';

export function ThaiFlagIcon({ className = 'w-[19px] h-[19px]' }: { className?: string }) {
  const rawId = useId();
  const maskId = `th-mask-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <svg
      viewBox="0 0 512 512"
      className={cn('rounded-full shrink-0 shadow-[0_0_1px_rgba(0,0,0,0.5)] select-none', className)}
      aria-hidden="true"
    >
      <mask id={maskId}>
        <circle cx="256" cy="256" r="256" fill="#fff" />
      </mask>
      <g mask={`url(#${maskId})`}>
        <path fill="#d80027" d="M0 0h512v89l-79.2 163.7L512 423v89H0v-89l82.7-169.6L0 89z" />
        <path fill="#eeeeee" d="M0 89h512v78l-42.6 91.2L512 345v78H0v-78l40-92.5L0 167z" />
        <path fill="#0052b4" d="M0 167h512v178H0z" />
      </g>
    </svg>
  );
}

export function UkFlagIcon({ className = 'w-[19px] h-[19px]' }: { className?: string }) {
  const rawId = useId();
  const maskId = `uk-mask-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <svg
      viewBox="0 0 512 512"
      className={cn('rounded-full shrink-0 shadow-[0_0_1px_rgba(0,0,0,0.5)] select-none', className)}
      aria-hidden="true"
    >
      <mask id={maskId}>
        <circle cx="256" cy="256" r="256" fill="#fff" />
      </mask>
      <g mask={`url(#${maskId})`}>
        <path
          fill="#eeeeee"
          d="m0 0 8 22-8 23v23l32 54-32 54v32l32 48-32 48v32l32 54-32 54v68l22-8 23 8h23l54-32 54 32h32l48-32 48 32h32l54-32 54 32h68l-8-22 8-23v-23l-32-54 32-54v-32l-32-48 32-48v-32l-32-54 32-54V0l-22 8-23-8h-23l-54 32-54-32h-32l-48 32-48-32h-32l-54 32L68 0H0z"
        />
        <path
          fill="#0052b4"
          d="M336 0v108L444 0Zm176 68L404 176h108zM0 176h108L0 68ZM68 0l108 108V0Zm108 512V404L68 512ZM0 444l108-108H0Zm512-108H404l108 108Zm-68 176L336 404v108z"
        />
        <path
          fill="#d80027"
          d="M0 0v45l131 131h45L0 0zm208 0v208H0v96h208v208h96V304h208v-96H304V0h-96zm259 0L336 131v45L512 0h-45zM176 336 0 512h45l131-131v-45zm160 0 176 176v-45L381 336h-45z"
        />
      </g>
    </svg>
  );
}

export interface LanguageToggleProps {
  className?: string;
  size?: 'sm' | 'md';
}

export function LanguageToggle({ className, size = 'md' }: LanguageToggleProps) {
  const { locale, setLocale } = useLocale();

  const isTh = locale === 'th';
  const isEn = locale === 'en';

  const flagSize = size === 'sm' ? 'w-4 h-4' : 'w-[19px] h-[19px]';
  const textClass = size === 'sm' ? 'text-[11px]' : 'text-[13px]';
  const itemPadding = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1.5';

  return (
    <div className={cn('inline-flex items-center', className)}>
      {/* Mobile single collapsed toggle (hidden on sm+) */}
      <button
        type="button"
        aria-label={isTh ? 'Switch language to English' : 'เปลี่ยนภาษาเป็นไทย'}
        onClick={() => setLocale(isTh ? 'en' : 'th')}
        className={cn(
          'sm:hidden flex items-center gap-1.5 rounded-full transition-all duration-200 cursor-pointer select-none',
          'bg-[#18181b] border border-[#27272a] hover:bg-[#27272a] text-white shadow-xs font-semibold',
          itemPadding
        )}
      >
        {isTh ? (
          <>
            <ThaiFlagIcon className={flagSize} />
            <span className={cn('leading-none tracking-normal', textClass)}>ไทย</span>
          </>
        ) : (
          <>
            <UkFlagIcon className={flagSize} />
            <span className={cn('leading-none tracking-normal font-sans', textClass)}>EN</span>
          </>
        )}
      </button>

      {/* Desktop dual segmented control (hidden on mobile, visible on sm+) */}
      <div
        role="group"
        aria-label="Language selection"
        className={cn(
          'hidden sm:inline-flex items-center p-[3px] rounded-full',
          'bg-[#18181b] border border-[#27272a] shadow-xs select-none'
        )}
      >
        {/* Thai Option */}
        <button
          type="button"
          role="radio"
          aria-checked={isTh}
          aria-label="เปลี่ยนภาษาเป็นไทย"
          onClick={() => setLocale('th')}
          className={cn(
            'flex items-center gap-1.5 rounded-full transition-all duration-200 cursor-pointer',
            itemPadding,
            isTh
              ? 'bg-[#27272a] border border-[#3f3f46]/90 text-white shadow-xs font-semibold'
              : 'border border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] font-medium'
          )}
        >
          <ThaiFlagIcon className={cn(flagSize, isTh ? 'opacity-100' : 'opacity-85')} />
          <span className={cn('leading-none tracking-normal', textClass)}>ไทย</span>
        </button>

        {/* English Option */}
        <button
          type="button"
          role="radio"
          aria-checked={isEn}
          aria-label="Switch language to English"
          onClick={() => setLocale('en')}
          className={cn(
            'flex items-center gap-1.5 rounded-full transition-all duration-200 cursor-pointer',
            itemPadding,
            isEn
              ? 'bg-[#27272a] border border-[#3f3f46]/90 text-white shadow-xs font-semibold'
              : 'border border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] font-medium'
          )}
        >
          <UkFlagIcon className={cn(flagSize, isEn ? 'opacity-100' : 'opacity-85')} />
          <span className={cn('leading-none tracking-normal font-sans', textClass)}>EN</span>
        </button>
      </div>
    </div>
  );
}

export default LanguageToggle;

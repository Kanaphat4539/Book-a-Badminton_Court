'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Image from 'next/image';
import styles from './auth-splash.module.css';

const SplashContext = createContext<(() => void) | null>(null);

export function useAuthSplash() {
  const showSplash = useContext(SplashContext);
  if (!showSplash) throw new Error('useAuthSplash requires AuthSplashProvider');
  return showSplash;
}

function AuthSplash({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(onComplete, 1000);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, [onComplete]);

  return (
    <div className={styles.splash} role="status" aria-live="polite" aria-label="Welcome to KMITL Badminton">
      <div className={styles.content} aria-hidden="true">
        <div className={styles.emblem}>
          <div className={styles.ring} />
          <div className={styles.logo}>
            <Image
              src="https://dynamic.design.com/preview/logodraft/19a68c63-7360-49b5-81f0-76059ea64263/image/extra-large.en-us.png"
              alt=""
              width={112}
              height={112}
              unoptimized
              loading="eager"
            />
          </div>
          <svg className={styles.shuttle} viewBox="0 0 64 64" fill="none">
            <path d="M24 43 8 15 21 8 33 5 47 8 56 17 38 45Z" fill="var(--color-surface)" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="m21 8 7 35M33 5v39M47 8 36 44M14 25l35 1M20 35h23" stroke="currentColor" strokeWidth="2" />
            <path d="M24 43h14v7a7 7 0 0 1-14 0Z" fill="currentColor" />
          </svg>
        </div>
        <p className={styles.eyebrow}>YOUR COURT IS CALLING</p>
        <p className={styles.title}>KMITL <span>BADMINTON</span></p>
        <p className={styles.caption}>Let’s play.</p>
        <div className={styles.track}><div /></div>
      </div>
    </div>
  );
}

export function AuthSplashProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const showSplash = useCallback(() => setVisible(true), []);
  const hideSplash = useCallback(() => setVisible(false), []);

  return (
    <SplashContext.Provider value={showSplash}>
      <div inert={visible}>{children}</div>
      {visible && <AuthSplash onComplete={hideSplash} />}
    </SplashContext.Provider>
  );
}

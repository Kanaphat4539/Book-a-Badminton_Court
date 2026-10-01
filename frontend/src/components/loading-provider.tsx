'use client';

import { createContext, useContext, useEffect, useLayoutEffect, useState, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import type { InternalAxiosRequestConfig } from 'axios';
import api from '@/lib/api';
import { createLoadingController } from '@/lib/loading-controller';
import './loading.css';

const LoadingContext = createContext<ReturnType<typeof createLoadingController> | null>(null);
const serverSnapshot = () => true;

export function usePageLoading() {
  const controller = useContext(LoadingContext);
  if (!controller) throw new Error('usePageLoading requires LoadingProvider');
  return controller;
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [controller] = useState(createLoadingController);
  const pathname = usePathname();
  const visible = useSyncExternalStore(controller.subscribe, controller.getSnapshot, serverSnapshot);

  useLayoutEffect(() => {
    controller.start();
    const releases = new WeakMap<InternalAxiosRequestConfig, () => void>();
    const finish = (config?: InternalAxiosRequestConfig) => {
      if (config) { releases.get(config)?.(); releases.delete(config); }
    };
    const request = api.interceptors.request.use(config => {
      releases.set(config, controller.track());
      return config;
    });
    const response = api.interceptors.response.use(result => {
      finish(result.config);
      return result;
    }, error => {
      finish(error.config);
      return Promise.reject(error);
    });
    return () => {
      api.interceptors.request.eject(request);
      api.interceptors.response.eject(response);
      controller.dispose();
    };
  }, [controller]);

  useEffect(() => { controller.ready(pathname); }, [controller, pathname]);

  useEffect(() => {
    document.body.classList.toggle('kmitl-loading-open', visible);
    return () => document.body.classList.remove('kmitl-loading-open');
  }, [visible]);

  return (
    <LoadingContext.Provider value={controller}>
      <div inert={visible} aria-busy={visible}>{children}</div>
      {visible ? (
        <div className="kmitl-loading" role="status" aria-live="polite" aria-label="กำลังเตรียมข้อมูลสนาม">
          <div className="kmitl-loading__card">
            <div className="kmitl-loading__eyebrow">KMITL BADMINTON</div>
            {/* Original animated GIF: preserve its animation without image optimization. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="kmitl-loading__runner" src="/images/badminton-loading.gif" width={362} height={362} alt="นักแบดถอยหลัง กระโดด และเหวี่ยงไม้ตบต่อเนื่อง" />
            <h1 className="kmitl-loading__title">Loading<span>.</span></h1>
            <p className="kmitl-loading__detail">กำลังเตรียมข้อมูลสนาม<br />อีกสักครู่นะ</p>
            <div className="kmitl-loading__track" aria-hidden="true"><span /></div>
          </div>
        </div>
      ) : null}
    </LoadingContext.Provider>
  );
}

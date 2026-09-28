// Only explicit page loads open the overlay. Requests merely keep it open.
export function createLoadingController() {
  let visible = true;
  let startedAt = 0;
  let pending = 0;
  let generation = 0;
  let pageReady = false;
  let source: string | undefined;
  let settleTimer: ReturnType<typeof setTimeout> | undefined;
  let safetyTimer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach(listener => listener());
  const clear = () => {
    clearTimeout(settleTimer);
    clearTimeout(safetyTimer);
  };
  const hide = () => {
    clear();
    visible = false;
    emit();
  };
  const settle = () => {
    clearTimeout(settleTimer);
    if (visible && pageReady && pending === 0) {
      // A short idle window includes requests started by destination effects.
      settleTimer = setTimeout(hide, Math.max(100, 800 - (Date.now() - startedAt)));
    }
  };
  return {
    getSnapshot: () => visible,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    start(from?: string) {
      clear();
      generation++;
      pending = 0;
      source = from;
      pageReady = false;
      startedAt = Date.now();
      visible = true;
      safetyTimer = setTimeout(hide, 15000);
      emit();
    },
    ready(path: string) {
      if (source === path) return;
      pageReady = true;
      settle();
    },
    track() {
      if (!visible) return () => {};
      const requestGeneration = generation;
      let released = false;
      pending++;
      clearTimeout(settleTimer);
      return () => {
        if (released || requestGeneration !== generation) return;
        released = true;
        pending--;
        settle();
      };
    },
    dispose() { clear(); generation++; },
  };
}

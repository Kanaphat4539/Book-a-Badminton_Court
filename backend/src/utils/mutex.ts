export class Mutex {
  private promise: Promise<void> | null = null;
  
  async acquire(): Promise<() => void> {
    let release!: () => void;
    const next = new Promise<void>(resolve => { release = resolve; });
    const wait = this.promise;
    
    this.promise = wait ? wait.then(() => next) : next;
    
    if (wait) {
      try {
        await wait;
      } catch (e) {}
    }
    
    return () => {
      release();
      if (this.promise === next) {
        this.promise = null;
      }
    };
  }
}

export const dbMutex = new Mutex();

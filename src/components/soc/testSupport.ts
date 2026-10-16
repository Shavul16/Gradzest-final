// Shared by the SOC component tests. Not imported by the app.

/** A stand-in for the dashboard's socket: components subscribe with on/off, and a test pushes an event with emit. */
export function fakeSocket() {
  const handlers = new Map<string, Set<(...args: any[]) => void>>();
  return {
    on(event: string, fn: (...args: any[]) => void) {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event)!.add(fn);
    },
    off(event: string, fn: (...args: any[]) => void) { handlers.get(event)?.delete(fn); },
    emit(event: string, ...args: any[]) { handlers.get(event)?.forEach(fn => fn(...args)); },
  };
}

/** A promise that settles when the test says so, to hold a request in flight. */
export function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

let seq = 0;
/** A minimal incident, with whatever the test needs overridden. */
export function incident(over: Record<string, unknown> = {}) {
  seq += 1;
  return {
    _id: `inc${seq}`, type: 'brute_force', severity: 'high', status: 'open', title: `Incident ${seq}`,
    notes: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...over,
  };
}

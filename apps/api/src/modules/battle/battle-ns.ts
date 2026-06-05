import type { Namespace } from 'socket.io';

// Singleton reference to the /battle Socket.io namespace.
// Stored here (not in battle.service.ts) to break the circular import between
// battle.service.ts ↔ battle.socket.ts.
let _ns: Namespace | null = null;

export const battleNsRef = {
  set(ns: Namespace): void { _ns = ns; },
  get(): Namespace | null { return _ns; },
};

// Shared toggle state for the right-side floating panels (Connections + Chat).
// Persisted in localStorage. Subscribers re-render via useSyncExternalStore.

import { useSyncExternalStore } from 'react';

export type PanelKey = 'connections' | 'chat';

interface State {
  connections: boolean;
  chat: boolean;
}

const LS_KEYS: Record<PanelKey, string> = {
  connections: 'phase-view.connections-panel.open',
  chat: 'phase-view.chat-drawer.open',
};

function readLS(key: PanelKey, defaultValue: boolean): boolean {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const v = localStorage.getItem(LS_KEYS[key]);
    if (v === '1') return true;
    if (v === '0') return false;
  } catch {
    /* private mode */
  }
  return defaultValue;
}

function writeLS(key: PanelKey, value: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_KEYS[key], value ? '1' : '0');
  } catch {
    /* private mode */
  }
}

let state: State = {
  // Connections: default open on wide screens.
  connections: readLS(
    'connections',
    typeof window !== 'undefined' ? window.innerWidth > 1100 : true,
  ),
  // Chat: default closed (opt-in feature).
  chat: readLS('chat', false),
};
const listeners = new Set<() => void>();

function notify(): void {
  for (const l of listeners) l();
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getPanel(key: PanelKey): boolean {
  return state[key];
}

export function setPanel(key: PanelKey, value: boolean): void {
  if (state[key] === value) return;
  state = { ...state, [key]: value };
  writeLS(key, value);
  notify();
}

export function togglePanel(key: PanelKey): void {
  setPanel(key, !state[key]);
}

export function usePanel(key: PanelKey): boolean {
  return useSyncExternalStore(
    subscribe,
    () => state[key],
    () => state[key],
  );
}

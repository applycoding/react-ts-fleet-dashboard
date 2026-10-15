import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { isSnapshot } from '../guards';
import { useUiStore } from '../store/ui';
import type { FleetSnapshot } from '../types';
import { browserEngine } from './browserEngine';

export const forceBrowser = import.meta.env.VITE_FORCE_BROWSER === 'true';

function socketUrl(): string {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${window.location.host}/ws`;
}

export function useDataMode(): void {
  const setLink = useUiStore((state) => state.setLink);

  useEffect(() => {
    if (forceBrowser) {
      setLink('browser', 'This build runs the simulator in the browser.');
      return;
    }

    let active = true;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 700);
    fetch('/api/health', { signal: controller.signal })
      .then((response) => {
        if (!active) return;
        if (response.ok) {
          setLink('live', 'Connected to the local simulator socket.');
          return;
        }
        setLink('browser', 'Simulator server did not respond. Running in this tab.');
      })
      .catch(() => {
        if (!active) return;
        setLink('browser', 'Simulator server is not reachable. Running in this tab.');
      })
      .finally(() => window.clearTimeout(timer));

    return () => {
      active = false;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [setLink]);
}

export function useFleetStream(): void {
  const mode = useUiStore((state) => state.dataMode);
  const setLink = useUiStore((state) => state.setLink);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (mode === 'browser') {
      const id = window.setInterval(() => {
        queryClient.setQueryData<FleetSnapshot>(['fleet', 'browser'], browserEngine.snapshot());
      }, 1000);
      return () => window.clearInterval(id);
    }

    if (mode !== 'live') return;

    let stopped = false;
    let socket: WebSocket | null = null;
    let retries = 0;
    let retryTimer = 0;

    const connect = () => {
      socket = new WebSocket(socketUrl());
      socket.onmessage = (event) => {
        try {
          const payload: unknown = JSON.parse(String(event.data));
          if (!isSnapshot(payload)) return;
          retries = 0;
          queryClient.setQueryData(['fleet', 'live'], payload);
        } catch {
          // Ignore malformed frames. The next tick replaces them.
        }
      };
      socket.onclose = () => {
        if (stopped) return;
        retries += 1;
        if (retries >= 2) {
          setLink('browser', 'Live socket closed. Showing the in-browser simulator.');
          return;
        }
        retryTimer = window.setTimeout(connect, 400);
      };
    };

    connect();
    return () => {
      stopped = true;
      window.clearTimeout(retryTimer);
      socket?.close();
    };
  }, [mode, queryClient, setLink]);
}

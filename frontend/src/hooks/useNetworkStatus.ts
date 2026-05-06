import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getApiBaseUrl } from '../api/http';

export type NetworkStatus = 'online' | 'checking' | 'offline' | 'server-down';

const CHECK_INTERVAL_MS = 25_000;
const HEALTH_TIMEOUT_MS = 4_000;

type NetworkState = {
  browserOnline: boolean;
  apiReachable: boolean;
  status: NetworkStatus;
  lastCheckedAt: Date | null;
  refresh: () => Promise<void>;
};

const getInitialOnlineState = () =>
  typeof navigator === 'undefined' ? true : navigator.onLine;

export const useNetworkStatus = (): NetworkState => {
  const [browserOnline, setBrowserOnline] = useState(getInitialOnlineState);
  const [apiReachable, setApiReachable] = useState(true);
  const [checking, setChecking] = useState(true);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    const online = getInitialOnlineState();
    setBrowserOnline(online);

    if (!online) {
      setChecking(false);
      setApiReachable(false);
      setLastCheckedAt(new Date());
      return;
    }

    setChecking(true);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

    try {
      const response = await fetch(`${getApiBaseUrl()}/health`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });

      if (!mountedRef.current) return;
      setApiReachable(response.ok);
    } catch {
      if (!mountedRef.current) return;
      setApiReachable(false);
    } finally {
      window.clearTimeout(timeoutId);
      if (mountedRef.current) {
        setChecking(false);
        setLastCheckedAt(new Date());
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refresh();

    const handleOnline = () => {
      setBrowserOnline(true);
      refresh();
    };
    const handleOffline = () => {
      setBrowserOnline(false);
      setApiReachable(false);
      setChecking(false);
      setLastCheckedAt(new Date());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const intervalId = window.setInterval(refresh, CHECK_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.clearInterval(intervalId);
    };
  }, [refresh]);

  const status = useMemo<NetworkStatus>(() => {
    if (!browserOnline) return 'offline';
    if (checking) return 'checking';
    if (!apiReachable) return 'server-down';
    return 'online';
  }, [apiReachable, browserOnline, checking]);

  return { browserOnline, apiReachable, status, lastCheckedAt, refresh };
};

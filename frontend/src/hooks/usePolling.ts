import { useEffect, useRef } from 'react';

/**
 * Polls `callback` every `intervalMs` while the tab is visible.
 * Pauses when the tab is hidden and runs once immediately on becoming visible,
 * to keep Supabase/API request volume low when nobody is looking.
 */
export const usePolling = (
  callback: () => void,
  intervalMs: number,
  enabled: boolean = true
) => {
  const savedCallback = useRef(callback);
  savedCallback.current = callback;

  useEffect(() => {
    if (!enabled) return;

    let timer: ReturnType<typeof setInterval> | undefined;

    const start = () => {
      if (timer) return;
      timer = setInterval(() => savedCallback.current(), intervalMs);
    };

    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = undefined;
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        savedCallback.current();
        start();
      }
    };

    if (!document.hidden) start();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [intervalMs, enabled]);
};

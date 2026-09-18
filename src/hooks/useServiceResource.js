import { useCallback, useEffect, useState } from "react";

/**
 * Loads data from an async service function and exposes the states every
 * API-backed component needs: `data`, `loading`, `error` and `reload`.
 *
 * Components stay the same when a service switches from demo data to a real
 * Orange API; only the service body changes.
 *
 * @param {() => Promise<any>} loader  must be stable (module function or useCallback)
 */
export function useServiceResource(loader) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: null }));

    loader()
      .then((data) => {
        if (active) {
          setState({ data, loading: false, error: null });
        }
      })
      .catch((error) => {
        if (active) {
          setState({ data: null, loading: false, error });
        }
      });

    return () => {
      active = false;
    };
  }, [loader, attempt]);

  const reload = useCallback(() => setAttempt((current) => current + 1), []);

  return { ...state, reload };
}

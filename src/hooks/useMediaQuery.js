import { useEffect, useState } from "react";

/**
 * Subscribes to a CSS media query. Used where layout has to change behaviour,
 * not just appearance (bottom sheet on mobile vs side panel on desktop).
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return false;
    }

    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return undefined;
    }

    const media = window.matchMedia(query);
    const onChange = (event) => setMatches(event.matches);

    setMatches(media.matches);
    media.addEventListener("change", onChange);

    return () => media.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

export function useIsDesktop() {
  return useMediaQuery("(min-width: 900px)");
}

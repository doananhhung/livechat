// src/hooks/use-media-query.ts
import { useState, useEffect } from "react";

/**
 * Returns the result of a CSS media query.
 * Initializes synchronously from window.matchMedia to avoid layout flash.
 */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => {
    // Initialize with actual value to prevent layout flash
    if (typeof window !== "undefined") {
      const initialValue = window.matchMedia(query).matches;
      console.log(`[useMediaQuery] INIT: query="${query}", matches=${initialValue}`);
      return initialValue;
    }
    console.log(`[useMediaQuery] INIT: SSR fallback, matches=false`);
    return false; // SSR fallback
  });

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      console.log(`[useMediaQuery] useEffect SYNC: query="${query}", updating ${matches} -> ${media.matches}`);
      setMatches(media.matches);
    }
    const listener = () => {
      console.log(`[useMediaQuery] CHANGE EVENT: query="${query}", new value=${media.matches}`);
      setMatches(media.matches);
    };
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  console.log(`[useMediaQuery] RENDER: query="${query}", returning=${matches}`);
  return matches;
}

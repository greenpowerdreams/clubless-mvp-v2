import { useEffect } from "react";

/**
 * Preload images for faster rendering.
 * Pass an array of URLs; they'll be fetched in the background.
 */
export function useImagePreload(urls: (string | null | undefined)[]) {
  useEffect(() => {
    const filtered = urls.filter(Boolean) as string[];
    filtered.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [urls.join(",")]);
}

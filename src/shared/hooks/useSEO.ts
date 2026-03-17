import { useEffect } from "react";
import { updateSEO, resetSEO } from "@/shared/lib/seo";

interface UseSEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

export function useSEO({ title, description, image, url, type }: UseSEOProps) {
  useEffect(() => {
    updateSEO({ title, description, image, url, type });
    return () => resetSEO();
  }, [title, description, image, url, type]);
}

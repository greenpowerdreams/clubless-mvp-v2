import { useEffect } from "react";
import { updateSEO, resetSEO } from "@/shared/lib/seo";

interface UseSEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  canonical?: string;
  robots?: string;
  keywords?: string;
}

export function useSEO(props: UseSEOProps) {
  useEffect(() => {
    updateSEO(props);
    return () => resetSEO();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    props.title,
    props.description,
    props.image,
    props.url,
    props.type,
    props.canonical,
    props.robots,
    props.keywords,
  ]);
}

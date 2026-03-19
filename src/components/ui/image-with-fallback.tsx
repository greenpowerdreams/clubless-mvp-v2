import { useState } from "react";
import { cn } from "@/lib/utils";
import { IMAGES } from "@/lib/images";

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackType?: "event" | "vendor" | "profile";
}

export function ImageWithFallback({
  src,
  alt,
  className,
  fallbackType = "event",
  ...props
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const fallbackSrc = IMAGES.placeholder[fallbackType];

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {loading && (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}
      <img
        src={error ? fallbackSrc : src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          loading ? "opacity-0" : "opacity-100"
        )}
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        {...props}
      />
    </div>
  );
}

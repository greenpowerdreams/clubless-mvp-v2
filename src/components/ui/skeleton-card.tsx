import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonCardProps {
  className?: string;
  variant?: "event" | "vendor";
}

export function SkeletonCard({ className, variant = "event" }: SkeletonCardProps) {
  if (variant === "vendor") {
    return (
      <div className={cn("rounded-xl overflow-hidden bg-card border border-border", className)}>
        <Skeleton className="aspect-[4/3] w-full" />
        <div className="p-5 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl overflow-hidden bg-card border border-border", className)}>
      <Skeleton className="aspect-[16/9] w-full" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-6 w-4/5" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6, variant = "event" }: { count?: number; variant?: "event" | "vendor" }) {
  return (
    <div className={cn(
      "grid gap-6",
      variant === "event" 
        ? "md:grid-cols-2 lg:grid-cols-3" 
        : "grid-cols-2 md:grid-cols-3"
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} variant={variant} />
      ))}
    </div>
  );
}

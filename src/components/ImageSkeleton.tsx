import { cn } from "@/lib/utils";
import { Loader2, ImageIcon, CheckCircle, AlertCircle } from "lucide-react";

type ImageStatus = 'pending' | 'generating' | 'complete' | 'error';

interface ImageSkeletonProps {
  status?: ImageStatus;
  label?: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'portrait';
}

/**
 * Skeleton component for images that are being generated.
 * Shows different states: pending, generating, complete, error.
 */
export function ImageSkeleton({ 
  status = 'pending', 
  label,
  className,
  aspectRatio = 'square'
}: ImageSkeletonProps) {
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]'
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-xl bg-muted/50 border border-border/30",
        aspectClasses[aspectRatio],
        className
      )}
    >
      {/* Animated gradient background */}
      {status === 'generating' && (
        <div className="absolute inset-0 bg-gradient-to-r from-muted/30 via-muted/60 to-muted/30 animate-shimmer" />
      )}
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
        {status === 'pending' && (
          <>
            <ImageIcon className="h-8 w-8 opacity-40" />
            <span className="text-xs opacity-60">Warten...</span>
          </>
        )}
        
        {status === 'generating' && (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
            <span className="text-xs font-medium">Bild wird erstellt...</span>
          </>
        )}
        
        {status === 'complete' && (
          <>
            <CheckCircle className="h-8 w-8 text-green-500" />
            <span className="text-xs font-medium">Fertig!</span>
          </>
        )}
        
        {status === 'error' && (
          <>
            <AlertCircle className="h-8 w-8 text-destructive" />
            <span className="text-xs font-medium">Fehler beim Laden</span>
          </>
        )}
        
        {label && (
          <span className="text-[10px] opacity-50 mt-1">{label}</span>
        )}
      </div>
    </div>
  );
}

interface ImageWithSkeletonProps {
  src?: string | null;
  alt: string;
  status?: ImageStatus;
  label?: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'portrait';
  onLoad?: () => void;
}

/**
 * Image component that shows a skeleton while loading.
 * Automatically shows the image once it's available.
 */
export function ImageWithSkeleton({ 
  src, 
  alt, 
  status = 'pending',
  label,
  className,
  aspectRatio = 'square',
  onLoad
}: ImageWithSkeletonProps) {
  if (src && status === 'complete') {
    return (
      <img 
        src={src} 
        alt={alt}
        className={cn(
          "rounded-xl object-cover animate-fade-in",
          aspectRatio === 'square' && 'aspect-square',
          aspectRatio === 'video' && 'aspect-video',
          aspectRatio === 'portrait' && 'aspect-[3/4]',
          className
        )}
        onLoad={onLoad}
      />
    );
  }

  return (
    <ImageSkeleton 
      status={status} 
      label={label} 
      className={className}
      aspectRatio={aspectRatio}
    />
  );
}

export default ImageSkeleton;

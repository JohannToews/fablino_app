import { useState, useCallback } from "react";
import { getThumbnailUrl } from "@/lib/imageUtils";

interface StoryImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string | null | undefined;
  thumbnailWidth?: number;
  thumbnailQuality?: number;
  fallbackSrc?: string;
}

/**
 * A resilient image component with 3-tier fallback:
 * 1. Thumbnail render URL (fast, optimized)
 * 2. Raw public URL (slower but reliable)
 * 3. Fallback SVG (always works)
 */
const StoryImage = ({
  src,
  thumbnailWidth = 400,
  thumbnailQuality = 60,
  fallbackSrc = "/fallback-illustration.svg",
  alt = "",
  ...props
}: StoryImageProps) => {
  const rawSrc = src || "";
  const thumbnailSrc = getThumbnailUrl(rawSrc, thumbnailWidth, thumbnailQuality);
  const [currentSrc, setCurrentSrc] = useState(thumbnailSrc || fallbackSrc);

  const handleError = useCallback(() => {
    setCurrentSrc((prev) => {
      // If thumbnail failed, try raw URL
      if (prev === thumbnailSrc && rawSrc && rawSrc !== thumbnailSrc) {
        return rawSrc;
      }
      // Otherwise show fallback
      return fallbackSrc;
    });
  }, [thumbnailSrc, rawSrc, fallbackSrc]);

  if (!rawSrc) {
    return <img src={fallbackSrc} alt={alt} {...props} />;
  }

  return <img src={currentSrc} onError={handleError} alt={alt} {...props} />;
};

export default StoryImage;


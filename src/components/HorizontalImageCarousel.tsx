import { useRef } from "react";

interface HorizontalImageCarouselProps {
  images: string[];
  direction?: "left" | "right";
  speed?: number; // seconds for full cycle
  imageSize?: "small" | "medium" | "large";
  className?: string;
}

const HorizontalImageCarousel = ({ 
  images, 
  direction = "left", 
  speed = 40,
  imageSize = "large",
  className = ""
}: HorizontalImageCarouselProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const sizeClasses = {
    small: "w-24 h-16",
    medium: "w-32 h-20 md:w-40 md:h-24",
    large: "w-40 h-24 md:w-48 md:h-28"
  };

  // Duplicate images for seamless loop
  const duplicatedImages = [...images, ...images, ...images];

  return (
    <div 
      ref={containerRef}
      className={`overflow-hidden relative ${className}`}
      style={{ maskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)" }}
    >
      <div 
        className={`flex flex-row gap-4 ${direction === "left" ? "animate-scroll-left" : "animate-scroll-right"}`}
        style={{ 
          animationDuration: `${speed}s`,
          animationTimingFunction: "linear",
          animationIterationCount: "infinite"
        }}
      >
        {duplicatedImages.map((src, idx) => (
          <div 
            key={idx} 
            className={`${sizeClasses[imageSize]} rounded-2xl overflow-hidden shadow-lg flex-shrink-0 border-2 border-white/50`}
          >
            <img 
              src={src} 
              alt="" 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default HorizontalImageCarousel;

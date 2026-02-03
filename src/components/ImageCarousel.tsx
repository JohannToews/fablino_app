import { useEffect, useState, useRef } from "react";

interface ImageCarouselProps {
  images: string[];
  direction?: "up" | "down";
  speed?: number; // seconds for full cycle
  imageSize?: "small" | "medium" | "large";
  className?: string;
}

const ImageCarousel = ({ 
  images, 
  direction = "up", 
  speed = 30,
  imageSize = "medium",
  className = ""
}: ImageCarouselProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const sizeClasses = {
    small: "w-16 h-16",
    medium: "w-20 h-20 md:w-24 md:h-24",
    large: "w-28 h-28 md:w-32 md:h-32"
  };

  // Duplicate images for seamless loop
  const duplicatedImages = [...images, ...images, ...images];

  return (
    <div 
      ref={containerRef}
      className={`overflow-hidden relative ${className}`}
      style={{ maskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)" }}
    >
      <div 
        className={`flex flex-col gap-4 ${direction === "up" ? "animate-scroll-up" : "animate-scroll-down"}`}
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

export default ImageCarousel;

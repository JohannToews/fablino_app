import { Star, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface PointsDisplayProps {
  points: number;
  size?: 'sm' | 'md' | 'lg';
  showTrend?: boolean;
  className?: string;
}

const sizes = {
  sm: {
    icon: "h-4 w-4",
    text: "text-sm font-semibold",
    container: "px-2 py-1 gap-1"
  },
  md: {
    icon: "h-5 w-5",
    text: "text-lg font-bold",
    container: "px-3 py-1.5 gap-2"
  },
  lg: {
    icon: "h-8 w-8",
    text: "text-3xl font-bold font-baloo",
    container: "px-4 py-2 gap-3"
  }
};

export const PointsDisplay = ({
  points,
  size = 'md',
  showTrend = false,
  className
}: PointsDisplayProps) => {
  const sizeClasses = sizes[size];
  const [displayPoints, setDisplayPoints] = useState(points);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (points !== displayPoints) {
      setIsAnimating(true);
      // Animate counting up
      const diff = points - displayPoints;
      const steps = Math.min(Math.abs(diff), 20);
      const stepValue = diff / steps;
      let current = displayPoints;
      let step = 0;

      const interval = setInterval(() => {
        step++;
        current += stepValue;
        setDisplayPoints(Math.round(current));
        
        if (step >= steps) {
          setDisplayPoints(points);
          setIsAnimating(false);
          clearInterval(interval);
        }
      }, 50);

      return () => clearInterval(interval);
    }
  }, [points]);

  return (
    <div className={cn(
      "inline-flex items-center rounded-full bg-primary/10 border border-primary/30",
      sizeClasses.container,
      className
    )}>
      <Star 
        className={cn(
          sizeClasses.icon, 
          "text-primary fill-primary",
          isAnimating && "animate-pulse"
        )} 
      />
      <span className={cn(sizeClasses.text, "text-primary tabular-nums")}>
        {displayPoints.toLocaleString()}
      </span>
      {showTrend && isAnimating && (
        <TrendingUp className="h-4 w-4 text-secondary animate-bounce" />
      )}
    </div>
  );
};

// Points gained animation overlay
export const PointsGainedAnimation = ({
  points,
  isVisible,
  onComplete
}: {
  points: number;
  isVisible: boolean;
  onComplete: () => void;
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onComplete, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: -30, scale: 1 }}
          exit={{ opacity: 0, y: -60, scale: 0.8 }}
          className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="bg-accent text-accent-foreground px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
            <Star className="h-6 w-6 fill-current" />
            <span className="text-2xl font-bold font-baloo">+{points}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FloatingIconsProps {
  icons: ReactNode[];
  children: ReactNode;
  className?: string;
}

const FloatingIcons = ({ icons, children, className }: FloatingIconsProps) => {
  // Position icons around the container
  const getPosition = (index: number, total: number) => {
    const positions = [
      { top: "-8px", left: "10%", delay: "0s" },
      { top: "15%", right: "-12px", delay: "0.5s" },
      { top: "50%", right: "-8px", delay: "1s" },
      { bottom: "15%", right: "-12px", delay: "1.5s" },
      { bottom: "-8px", right: "20%", delay: "2s" },
      { bottom: "-8px", left: "30%", delay: "2.5s" },
      { bottom: "20%", left: "-12px", delay: "3s" },
      { top: "40%", left: "-10px", delay: "3.5s" },
      { top: "-8px", right: "25%", delay: "0.3s" },
      { top: "-8px", left: "45%", delay: "1.2s" },
    ];
    return positions[index % positions.length];
  };

  return (
    <div className={cn("relative", className)}>
      {/* Floating icons */}
      {icons.map((icon, index) => {
        const pos = getPosition(index, icons.length);
        return (
          <div
            key={index}
            className="absolute z-10 animate-float-icon"
            style={{
              top: pos.top,
              bottom: pos.bottom,
              left: pos.left,
              right: pos.right,
              animationDelay: pos.delay,
            }}
          >
            <div className="bg-background/90 backdrop-blur-sm rounded-full p-1.5 shadow-md border border-border/50">
              {icon}
            </div>
          </div>
        );
      })}
      {/* Content */}
      {children}
    </div>
  );
};

export default FloatingIcons;

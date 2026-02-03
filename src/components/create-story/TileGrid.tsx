import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TileGridProps {
  children: ReactNode;
  className?: string;
}

const TileGrid = ({ children, className }: TileGridProps) => {
  return (
    <div className={cn(
      "grid grid-cols-4 gap-2 sm:gap-3",
      className
    )}>
      {children}
    </div>
  );
};

export default TileGrid;

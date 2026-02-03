import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SegmentOption {
  value: string;
  label: ReactNode;
}

interface SegmentButtonProps {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const SegmentButton = ({ options, value, onChange, className }: SegmentButtonProps) => {
  return (
    <div className={cn(
      "inline-flex bg-muted rounded-xl p-1 gap-1",
      className
    )}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
            "flex items-center justify-center min-w-[48px]",
            value === option.value
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default SegmentButton;

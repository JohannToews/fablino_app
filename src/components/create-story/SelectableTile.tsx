import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface SelectableTileProps {
  icon: ReactNode;
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const SelectableTile = ({ icon, label, selected, onClick, disabled }: SelectableTileProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative flex flex-col items-center justify-center gap-1 p-3 rounded-2xl",
        "bg-card shadow-md transition-all duration-200",
        "hover:scale-105 hover:shadow-lg active:scale-95",
        "min-w-[72px] min-h-[72px]",
        selected && "bg-primary/10 border-2 border-primary shadow-lg",
        !selected && "border-2 border-transparent",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {/* Checkmark overlay */}
      {selected && (
        <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5 shadow-md">
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>
      )}
      
      {/* Icon */}
      <span className="text-2xl">{icon}</span>
      
      {/* Label */}
      <span className={cn(
        "text-xs font-medium text-center leading-tight",
        selected ? "text-primary" : "text-muted-foreground"
      )}>
        {label}
      </span>
    </button>
  );
};

export default SelectableTile;

import { cn } from "@/lib/utils";

interface CharacterTileProps {
  image: string;
  label: string;
  onClick: () => void;
  selected?: boolean;
  size?: "normal" | "small";
  badge?: string;
  className?: string;
}

const CharacterTile = ({
  image,
  label,
  onClick,
  selected = false,
  size = "normal",
  badge,
  className,
}: CharacterTileProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center gap-1.5 md:gap-2 p-2 md:p-3 rounded-xl md:rounded-2xl",
        "bg-card border-2 transition-all duration-200",
        "hover:scale-105 hover:shadow-lg active:scale-95",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        selected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-border hover:border-primary/50",
        size === "small" && "p-1.5 md:p-2 gap-1",
        className
      )}
    >
      {/* Image Container */}
      <div
        className={cn(
          "relative overflow-hidden rounded-lg md:rounded-xl",
          size === "normal" ? "w-full aspect-[4/3]" : "w-full aspect-square"
        )}
      >
        <img
          src={image}
          alt={label}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
        />
        
        {/* Selection Indicator */}
        {selected && (
          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary flex items-center justify-center">
              <svg
                className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Badge (e.g., star for "Surprise me") */}
        {badge && (
          <div className="absolute top-0.5 right-0.5 md:top-1 md:right-1 text-sm md:text-lg">{badge}</div>
        )}
      </div>

      {/* Label */}
      <span
        className={cn(
          "font-baloo font-medium text-center text-foreground leading-tight",
          size === "normal" ? "text-xs md:text-sm" : "text-[10px] md:text-xs"
        )}
      >
        {label}
      </span>
    </button>
  );
};

export default CharacterTile;


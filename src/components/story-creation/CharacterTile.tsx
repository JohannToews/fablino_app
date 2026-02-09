import { cn } from "@/lib/utils";

interface CharacterTileProps {
  image: string;
  label: string;
  onClick: () => void;
  selected?: boolean;
  size?: "normal" | "small";
  badge?: string;
  className?: string;
  overlayClass?: string;
}

const CharacterTile = ({
  image,
  label,
  onClick,
  selected = false,
  size = "normal",
  badge,
  className,
  overlayClass,
}: CharacterTileProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center gap-1.5 p-2 rounded-xl",
        "bg-white border transition-all duration-200 cursor-pointer",
        "hover:shadow-md active:scale-[0.97]",
        "focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2",
        selected
          ? "ring-2 ring-[#E8863A] border-[#E8863A] bg-orange-50 shadow-md"
          : "border-[#E8863A]/10 hover:border-[#E8863A]/30",
        className
      )}
    >
      {/* Image Container */}
      <div className="relative w-full overflow-hidden rounded-lg aspect-square">
        <img
          src={image}
          alt={label}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
        />
        
        {/* Color palette overlay filter */}
        {overlayClass && (
          <div className={cn("absolute inset-0 pointer-events-none", overlayClass)} />
        )}
        
        {/* Selection Indicator */}
        {selected && (
          <div className="absolute inset-0 bg-orange-400/20 flex items-center justify-center">
            <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
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
          <div className="absolute top-1 right-1 text-base">{badge}</div>
        )}
      </div>

      {/* Label */}
      <span className="font-baloo font-semibold text-center text-[#2D1810] leading-tight text-sm">
        {label}
      </span>
    </button>
  );
};

export default CharacterTile;


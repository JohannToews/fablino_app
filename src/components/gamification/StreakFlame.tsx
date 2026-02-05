import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakFlameProps {
  streak: number;
  flameType: 'none' | 'bronze' | 'silver' | 'gold' | 'diamond';
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const flameColors = {
  none: "text-muted-foreground/50",
  bronze: "text-orange-400",
  silver: "text-slate-300",
  gold: "text-yellow-400",
  diamond: "text-cyan-300"
};

const flameGlows = {
  none: "",
  bronze: "drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]",
  silver: "drop-shadow-[0_0_8px_rgba(203,213,225,0.5)]",
  gold: "drop-shadow-[0_0_12px_rgba(250,204,21,0.6)]",
  diamond: "drop-shadow-[0_0_15px_rgba(103,232,249,0.7)]"
};

const sizes = {
  sm: { icon: "h-4 w-4", text: "text-xs", container: "gap-0.5" },
  md: { icon: "h-6 w-6", text: "text-sm", container: "gap-1" },
  lg: { icon: "h-10 w-10", text: "text-xl font-bold", container: "gap-2" }
};

export const StreakFlame = ({
  streak,
  flameType,
  showCount = true,
  size = 'md',
  className
}: StreakFlameProps) => {
  const sizeClasses = sizes[size];
  const isActive = streak > 0;

  return (
    <div className={cn(
      "flex items-center",
      sizeClasses.container,
      className
    )}>
      <Flame
        className={cn(
          sizeClasses.icon,
          flameColors[flameType],
          flameGlows[flameType],
          isActive && "animate-pulse"
        )}
        fill={isActive ? "currentColor" : "none"}
      />
      {showCount && (
        <span className={cn(
          sizeClasses.text,
          isActive ? "text-foreground font-semibold" : "text-muted-foreground"
        )}>
          {streak}
        </span>
      )}
    </div>
  );
};

export const StreakMilestoneCard = ({
  milestone,
  achieved,
  points
}: {
  milestone: number;
  achieved: boolean;
  points: number;
}) => {
  const flameType = milestone >= 30 ? 'diamond' 
    : milestone >= 14 ? 'gold' 
    : milestone >= 7 ? 'silver' 
    : 'bronze';

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-xl border transition-all",
      achieved 
        ? "bg-primary/10 border-primary/30" 
        : "bg-muted/30 border-border opacity-60"
    )}>
      <StreakFlame
        streak={milestone}
        flameType={achieved ? flameType : 'none'}
        showCount={false}
        size="md"
      />
      <div className="flex-1">
        <p className="font-medium">{milestone} Tage</p>
        <p className="text-xs text-muted-foreground">+{points} Punkte</p>
      </div>
      {achieved && (
        <span className="text-lg">✓</span>
      )}
    </div>
  );
};

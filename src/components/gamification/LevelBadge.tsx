import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import type { LevelInfo } from "@/hooks/useGamification";

interface LevelBadgeProps {
  level: LevelInfo;
  totalPoints: number;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: {
    icon: "text-xl",
    title: "text-xs",
    container: "px-2 py-1 gap-1"
  },
  md: {
    icon: "text-2xl",
    title: "text-sm font-medium",
    container: "px-3 py-1.5 gap-2"
  },
  lg: {
    icon: "text-4xl",
    title: "text-lg font-bold",
    container: "px-4 py-2 gap-3"
  }
};

export const LevelBadge = ({
  level,
  totalPoints,
  showProgress = false,
  size = 'md',
  className
}: LevelBadgeProps) => {
  const sizeClasses = sizes[size];
  
  const progressPercent = level.nextLevelPoints
    ? ((totalPoints - level.minPoints) / (level.nextLevelPoints - level.minPoints)) * 100
    : 100;

  return (
    <div className={cn("flex flex-col", className)}>
      <div className={cn(
        "inline-flex items-center rounded-full bg-primary/20 border border-primary/30",
        sizeClasses.container
      )}>
        <span className={sizeClasses.icon}>{level.icon}</span>
        <span className={cn(sizeClasses.title, "text-primary")}>{level.title}</span>
      </div>
      
      {showProgress && !level.isMaxLevel && (
        <div className="mt-2 space-y-1">
          <Progress value={progressPercent} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {totalPoints} / {level.nextLevelPoints} Punkte
          </p>
        </div>
      )}
    </div>
  );
};

export const LevelCard = ({
  levelNumber,
  title,
  icon,
  minPoints,
  isUnlocked,
  isCurrent
}: {
  levelNumber: number;
  title: string;
  icon: string;
  minPoints: number;
  isUnlocked: boolean;
  isCurrent: boolean;
}) => {
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-xl border transition-all",
      isCurrent && "ring-2 ring-primary bg-primary/10 border-primary/30",
      isUnlocked && !isCurrent && "bg-card border-border",
      !isUnlocked && "bg-muted/30 border-border opacity-50"
    )}>
      <div className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center text-2xl",
        isUnlocked ? "bg-primary/20" : "bg-muted"
      )}>
        {isUnlocked ? icon : "🔒"}
      </div>
      <div className="flex-1">
        <p className={cn(
          "font-medium",
          !isUnlocked && "text-muted-foreground"
        )}>
          Level {levelNumber}: {title}
        </p>
        <p className="text-xs text-muted-foreground">
          {minPoints} Punkte
        </p>
      </div>
      {isCurrent && (
        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
          Aktuell
        </span>
      )}
    </div>
  );
};

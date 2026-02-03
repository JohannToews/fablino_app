import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  icon: ReactNode;
  title: string;
  className?: string;
}

const SectionHeader = ({ icon, title, className }: SectionHeaderProps) => {
  return (
    <h2 className={cn(
      "text-lg font-baloo font-bold text-primary text-center flex items-center justify-center gap-2 mb-4",
      className
    )}>
      <span className="text-xl">{icon}</span>
      {title}
    </h2>
  );
};

export default SectionHeader;

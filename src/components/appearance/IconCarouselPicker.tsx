import { useRef, useState } from "react";
import { motion } from "framer-motion";
import type { AppearanceOption } from "@/config/appearanceSlots";

interface IconCarouselPickerProps {
  options: AppearanceOption[];
  selectedValue: string | undefined;
  onChange: (value: string) => void;
  language: string;
}

export default function IconCarouselPicker({ options, selectedValue, onChange, language }: IconCarouselPickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {options.map((opt) => {
        const isSelected = selectedValue === opt.value;
        const label = opt.label[language] || opt.label.en || opt.label.de || opt.value;

        return (
          <motion.button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-shrink-0 snap-center flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all min-w-[80px] ${
              isSelected
                ? "border-[#F97316] bg-orange-50 shadow-sm"
                : "border-[hsl(30,20%,88%)] bg-white"
            }`}
            animate={isSelected ? { scale: 1.05 } : { scale: 1 }}
            whileTap={{ scale: 0.95 }}
          >
            {opt.icon ? (
              <IconWithFallback icon={opt.icon} label={label} />
            ) : (
              <span className="text-2xl">📌</span>
            )}
            <span className="text-xs font-medium text-[hsl(20,50%,12%)] text-center leading-tight max-w-[72px] truncate">
              {label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

function IconWithFallback({ icon, label }: { icon: string; label: string }) {
  const [failed, setFailed] = useState(false);
  const src = `/appearance/${icon}`;

  if (failed) {
    return (
      <span className="w-10 h-10 flex items-center justify-center text-xs font-bold text-[hsl(20,50%,12%)] bg-[hsl(30,20%,95%)] rounded-lg">
        {label.slice(0, 3)}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={label}
      className="w-10 h-10 object-contain"
      onError={() => setFailed(true)}
    />
  );
}

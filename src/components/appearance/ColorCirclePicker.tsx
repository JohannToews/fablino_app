import { motion } from "framer-motion";
import type { AppearanceOption } from "@/config/appearanceSlots";

interface ColorCirclePickerProps {
  options: AppearanceOption[];
  selectedValue: string | undefined;
  onChange: (value: string) => void;
}

export default function ColorCirclePicker({ options, selectedValue, onChange }: ColorCirclePickerProps) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {options.map((opt) => (
        <motion.button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`w-12 h-12 rounded-full border-2 border-[hsl(30,20%,88%)] transition-all ${
            selectedValue === opt.value ? "ring-2 ring-[#F97316] ring-offset-2" : ""
          }`}
          style={{ backgroundColor: opt.hex || "#ccc" }}
          whileTap={{ scale: 0.95 }}
          aria-label={opt.value}
        />
      ))}
    </div>
  );
}

import type { AppearanceSlot, AgeCategory } from "@/config/appearanceSlots";
import { getFilteredOptions } from "@/config/appearanceSlots";
import ColorCirclePicker from "./ColorCirclePicker";
import IconCarouselPicker from "./IconCarouselPicker";
import { motion } from "framer-motion";

interface AppearanceSlotPickerProps {
  slot: AppearanceSlot;
  value: string | boolean | undefined;
  onChange: (value: string | boolean) => void;
  ageCategory: AgeCategory;
  gender: 'male' | 'female' | null;
  language: string;
}

export default function AppearanceSlotPicker({ slot, value, onChange, ageCategory, gender, language }: AppearanceSlotPickerProps) {
  const options = getFilteredOptions(slot, ageCategory, gender);
  if (options.length === 0) return null;

  const label = slot.label[language] || slot.label.en || slot.label.de || slot.key;
  const stringValue = typeof value === 'boolean' ? String(value) : (value as string | undefined);

  return (
    <section className="rounded-2xl p-4 bg-white border border-[hsl(30,20%,92%)] shadow-sm mb-4">
      <h2 className="text-sm font-semibold text-[hsl(20,50%,12%)] mb-3">{label}</h2>

      {slot.pickerType === 'color' && (
        <ColorCirclePicker
          options={options}
          selectedValue={stringValue}
          onChange={onChange}
        />
      )}

      {slot.pickerType === 'icon_carousel' && (
        <IconCarouselPicker
          options={options}
          selectedValue={stringValue}
          onChange={onChange}
          language={language}
        />
      )}

      {slot.pickerType === 'toggle' && (
        <div className="flex gap-3 justify-center">
          {options.map((opt) => {
            const isSelected = stringValue === opt.value;
            const optLabel = opt.label[language] || opt.label.en || opt.label.de || opt.value;
            return (
              <motion.button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value === 'true' ? true : opt.value === 'false' ? false : opt.value)}
                className={`flex-1 max-w-[160px] py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  isSelected
                    ? "border-[#F97316] bg-orange-50 text-[hsl(30,80%,30%)]"
                    : "border-[hsl(30,20%,88%)] bg-white text-[hsl(20,50%,12%)]"
                }`}
                whileTap={{ scale: 0.98 }}
              >
                {optLabel}
              </motion.button>
            );
          })}
        </div>
      )}

      {slot.pickerType === 'button_group' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {options.map((opt) => {
            const isSelected = stringValue === opt.value;
            const optLabel = opt.label[language] || opt.label.en || opt.label.de || opt.value;
            return (
              <motion.button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className={`px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                  isSelected
                    ? "border-[#F97316] bg-orange-50 text-[hsl(30,80%,30%)]"
                    : "border-[hsl(30,20%,88%)] bg-white text-[hsl(20,50%,12%)]"
                }`}
                whileTap={{ scale: 0.98 }}
              >
                {optLabel}
              </motion.button>
            );
          })}
        </div>
      )}
    </section>
  );
}

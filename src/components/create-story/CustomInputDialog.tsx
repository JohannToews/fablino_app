import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

interface CustomInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  placeholder: string;
  onSubmit: (value: string) => void;
  submitLabel: string;
}

const CustomInputDialog = ({
  open,
  onOpenChange,
  title,
  placeholder,
  onSubmit,
  submitLabel,
}: CustomInputDialogProps) => {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value.trim());
      setValue("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-baloo">
            <Plus className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="text-base"
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!value.trim()}
            className="w-full btn-primary-kid"
          >
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomInputDialog;

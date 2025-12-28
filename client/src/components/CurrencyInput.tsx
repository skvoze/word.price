import { Input } from "@/components/ui/input";
import { Coins } from "lucide-react";

interface CurrencyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: number; // in cents
  onValueChange: (value: number) => void;
}

export function CurrencyInput({ value, onValueChange, className, ...props }: CurrencyInputProps) {
  const displayValue = value ? (value / 100).toFixed(2) : "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9.]/g, "");
    
    // Allow clearing input
    if (rawValue === "") {
      onValueChange(0);
      return;
    }

    // Handle decimal points
    const parts = rawValue.split(".");
    if (parts.length > 2) return; // Only one decimal point
    if (parts[1] && parts[1].length > 2) return; // Max 2 decimal places

    const floatValue = parseFloat(rawValue);
    if (!isNaN(floatValue)) {
      onValueChange(Math.round(floatValue * 100));
    }
  };

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        <Coins className="w-5 h-5" />
      </div>
      <div className="absolute left-10 top-1/2 -translate-y-1/2 text-foreground font-semibold">
        $
      </div>
      <Input
        type="text" // Use text to control formatting better
        inputMode="decimal"
        className={`pl-14 text-lg font-mono tracking-wide ${className}`}
        value={displayValue}
        onChange={handleChange}
        placeholder="0.00"
        {...props}
      />
    </div>
  );
}

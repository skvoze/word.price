import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import React, { forwardRef } from "react";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number; 
  onValueChange: (value: number) => void;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onValueChange, className, ...props }, ref) => {
    const displayValue = value > 0 
      ? (value / 100).toLocaleString('ru-RU', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).replace(',', '.')
      : "";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     let rawValue = e.target.value.replace(/\s/g, "").replace(/[^0-9.]/g, "");
      if (rawValue === "") {
        onValueChange(0);
        return;
      }
      const parts = rawValue.split(".");
      if (parts.length > 2) return; 
      if (parts[1] && parts[1].length > 2) return; 

      const floatValue = parseFloat(rawValue);
      const DB_LIMIT = 10000000;
      if (!isNaN(floatValue)) {
        if (floatValue > DB_LIMIT) {
          onValueChange(DB_LIMIT * 100);
        } else {
       onValueChange(Math.round(floatValue * 100));
      }
  }    };

    return (
      <div className="relative w-full group">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold pointer-events-none group-focus-within:text-primary transition-colors">
          <span className="text-2xl">₽</span>
        </div>
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          className={cn(
            "pl-12 h-16 text-2xl font-bold bg-secondary/20 border-transparent focus-visible:ring-primary/20 transition-all",
            className
          )}
          value={displayValue}
          onChange={handleChange}
          placeholder="0"
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
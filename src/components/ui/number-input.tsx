import * as React from "react";
import { cn } from "@/lib/utils";

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  allowEmpty?: boolean;
  defaultValue?: number;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value, onChange, min, max, allowEmpty = false, defaultValue = 0, onBlur, ...props }, ref) => {
    // Track the display value separately to allow empty state during editing
    const [displayValue, setDisplayValue] = React.useState<string>(String(value));
    
    // Sync display value when external value changes
    React.useEffect(() => {
      setDisplayValue(String(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Allow empty string during editing
      if (inputValue === '' || inputValue === '-') {
        setDisplayValue(inputValue);
        return;
      }
      
      // Parse the number
      const parsed = parseFloat(inputValue);
      
      if (!isNaN(parsed)) {
        // Update display value immediately for responsive feel
        setDisplayValue(inputValue);
        
        // Clamp to min/max if specified
        let clampedValue = parsed;
        if (min !== undefined && parsed < min) clampedValue = min;
        if (max !== undefined && parsed > max) clampedValue = max;
        
        onChange(clampedValue);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // On blur, ensure we have a valid number
      const parsed = parseFloat(displayValue);
      
      if (isNaN(parsed) || displayValue === '') {
        const fallback = defaultValue ?? min ?? 0;
        setDisplayValue(String(fallback));
        onChange(fallback);
      } else {
        // Ensure display shows the clamped value
        let finalValue = parsed;
        if (min !== undefined && parsed < min) finalValue = min;
        if (max !== undefined && parsed > max) finalValue = max;
        setDisplayValue(String(finalValue));
        onChange(finalValue);
      }
      
      onBlur?.(e);
    };

    return (
      <input
        type="text"
        inputMode="decimal"
        pattern="[0-9]*\.?[0-9]*"
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        {...props}
      />
    );
  }
);

NumberInput.displayName = "NumberInput";

export { NumberInput };

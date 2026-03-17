import { useState, useMemo } from "react";
import { calculate, scoreViability, getRecommendedStaffing, DEFAULT_INPUTS } from "../calculator.engine";
import type { CalculatorInputs, CalculatorOutputs, ViabilityScore } from "../calculator.types";

export function useCalculator(initialInputs?: Partial<CalculatorInputs>) {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    ...DEFAULT_INPUTS,
    ...initialInputs,
  });

  const outputs: CalculatorOutputs = useMemo(() => calculate(inputs), [inputs]);
  const viability: ViabilityScore = useMemo(() => scoreViability(inputs, outputs), [inputs, outputs]);

  const updateInput = <K extends keyof CalculatorInputs>(
    key: K,
    value: CalculatorInputs[K]
  ) => {
    setInputs((prev) => {
      const next = { ...prev, [key]: value };
      // Sync catering guests with attendance when in per-person mode
      if (key === "attendance" && prev.cateringMode === "per-person" && prev.cateringGuests === prev.attendance) {
        next.cateringGuests = value as number;
      }
      return next;
    });
  };

  const loadInputs = (saved: CalculatorInputs) => {
    setInputs({ ...DEFAULT_INPUTS, ...saved });
  };

  const autoFillStaffing = () => {
    const rec = getRecommendedStaffing(inputs.attendance, inputs.eventDurationHours);
    setInputs((prev) => ({
      ...prev,
      includeBartending: true,
      numBartenders: rec.bartenders,
      bartenderHours: rec.hours,
      includeSecurity: true,
      numSecurity: rec.security,
      securityHours: rec.hours,
    }));
  };

  const reset = () => setInputs(DEFAULT_INPUTS);

  return {
    inputs,
    outputs,
    viability,
    updateInput,
    loadInputs,
    autoFillStaffing,
    reset,
  };
}

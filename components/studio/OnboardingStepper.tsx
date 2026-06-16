import { Check } from 'lucide-react';

interface OnboardingStepperProps {
  currentStep: number; // 0-based
  steps: string[];
}

export default function OnboardingStepper({ currentStep, steps }: OnboardingStepperProps) {
  return (
    <div className="flex items-center justify-center gap-2 md:gap-4 select-none">
      {steps.map((label, i) => {
        const active = currentStep === i;
        const done = currentStep > i;
        
        return (
          <div key={label} className="flex items-center gap-2 md:gap-4">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border transition-all ${
                  done
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                    : active
                    ? 'bg-violet-600/15 border-violet-500 text-violet-300'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-500'
                }`}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span
                className={`text-[10px] uppercase font-bold tracking-wider ${
                  active ? 'text-violet-400' : done ? 'text-emerald-400' : 'text-neutral-500'
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-[1px] w-8 md:w-16 transition-all ${
                  done ? 'bg-emerald-500/30' : 'bg-neutral-800'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

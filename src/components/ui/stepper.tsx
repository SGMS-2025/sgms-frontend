import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/utils/utils';

export interface StepperStep {
  id: string;
  title: string;
  description?: string;
  optional?: boolean;
}

interface StepperProps {
  steps: StepperStep[];
  currentStep: number;
  completedSteps?: number[];
  className?: string;
}

export function Stepper({ steps, currentStep, completedSteps = [], className }: StepperProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(index) || index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center flex-1">
                {/* Step Circle */}
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all',
                    isCompleted
                      ? 'bg-primary border-primary text-white'
                      : isCurrent
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-gray-100 border-gray-300 text-gray-400'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>

                {/* Step Title */}
                <div className="mt-2 text-center max-w-[120px]">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isCurrent ? 'text-primary' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                    )}
                  >
                    {step.title}
                  </p>
                  {step.description && <p className="text-xs text-gray-500 mt-1">{step.description}</p>}
                  {/* Optional flag retained for layout if needed, but no extra label to avoid duplicate text */}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn('flex-1 h-0.5 mx-2 transition-all', index < currentStep ? 'bg-primary' : 'bg-gray-200')}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import type React from "react";
import { useState } from "react";
import { Card } from "../ui/card";
import { cn } from "@/lib/utils";
import { Steps, type Step, type StepsProps } from "./steps";
import { LiquidGlassCard } from "../liquid-glass/liquid-glass";

export interface StepComponentProps {
  onNext: () => void;
  onPrev: () => void;
  goToStep: (step: number) => void;
  isLastStep: boolean;
  isFirstStep: boolean;
}

export interface StepConfig extends Step {
  component: React.ComponentType<StepComponentProps>;
}

interface BaseStepsProps
  extends Omit<StepsProps, "steps" | "currentStep" | "onChange"> {
  steps: StepConfig[];
  initialStep?: number;
  containerClassName?: string;
  wrapperCardClassName?: string;
}

export function BaseSteps({
  steps,
  initialStep = 1,
  containerClassName,
  wrapperCardClassName,
  ...stepsUiProps
}: BaseStepsProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === steps.length;

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleGoToStep = (step: number) => {
    if (step >= 1 && step <= steps.length) {
      setCurrentStep(step);
    }
  };

  const uiSteps: Step[] = steps.map(({ component, ...rest }) => rest);

  const CurrentComponent = steps[currentStep - 1]?.component;

  return (
    <LiquidGlassCard>
      <Card
        className={cn(
          "p-4 sm:p-6 md:p-10 border-0 bg-transparent!",
          wrapperCardClassName,
        )}
      >
        <Steps
          {...stepsUiProps}
          steps={uiSteps}
          currentStep={currentStep}
          onChange={setCurrentStep}
        />

        <div
          className={cn(
            "mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500",
            containerClassName,
          )}
        >
          {CurrentComponent ? (
            <CurrentComponent
              onNext={handleNext}
              onPrev={handlePrev}
              goToStep={handleGoToStep}
              isLastStep={isLastStep}
              isFirstStep={isFirstStep}
            />
          ) : (
            <div className="text-center text-muted-foreground py-10">
              Missing component configuration for step {currentStep}
            </div>
          )}
        </div>
      </Card>
    </LiquidGlassCard>
  );
}

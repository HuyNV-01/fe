/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation> */
/** biome-ignore-all lint/a11y/noSvgWithoutTitle: <explanation> */
"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Check } from "lucide-react";

export interface Step {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  status?: "completed" | "active" | "upcoming" | "error";
  disabled?: boolean;
  content?: React.ReactNode;
}

export interface ConnectorConfig {
  show?: boolean;
  animated?: boolean;
  style?: "solid" | "dashed" | "gradient";
  position?: "top" | "bottom" | "center";
  color?: string;
}

export interface StepsProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  onChange?: (step: number) => void;
  className?: string;
  orientation?: "horizontal" | "vertical";
  showProgressBar?: boolean;
  showProgressPercentage?: boolean;
  allowClickNavigation?: boolean;
  size?: "sm" | "md" | "lg";
  labelPlacement?: "bottom" | "right";
  variant?: "default" | "navigation" | "minimal" | "card";
  mobileLayout?: "collapse" | "scroll" | "stack";
  connectorConfig?: ConnectorConfig;
  cardClassName?: string;
}

const sizeConfig = {
  sm: {
    circle: {
      mobile: "w-7 h-7",
      tablet: "w-8 h-8",
      desktop: "w-8 h-8",
    },
    connector: {
      mobile: { width: "h-0.5", spacing: "mx-0" },
      tablet: { width: "h-0.5", spacing: "mx-0" },
      desktop: { width: "h-1", spacing: "mx-0" },
    },
    icon: "w-3.5 h-3.5",
    text: "text-xs",
    titleText: "text-xs font-medium",
    gap: "gap-2",
    padding: "p-2",
  },
  md: {
    circle: {
      mobile: "w-9 h-9",
      tablet: "w-10 h-10",
      desktop: "w-10 h-10",
    },
    connector: {
      mobile: { width: "h-0.5", spacing: "mx-0" },
      tablet: { width: "h-1", spacing: "mx-0" },
      desktop: { width: "h-1.5", spacing: "mx-0" },
    },
    icon: "w-4 h-4",
    text: "text-sm",
    titleText: "text-sm font-semibold",
    gap: "gap-3",
    padding: "p-3",
  },
  lg: {
    circle: {
      mobile: "w-11 h-11",
      tablet: "w-12 h-12",
      desktop: "w-12 h-12",
    },
    connector: {
      mobile: { width: "h-0.5", spacing: "mx-0" },
      tablet: { width: "h-1", spacing: "mx-0" },
      desktop: { width: "h-2", spacing: "mx-0" },
    },
    icon: "w-5 h-5",
    text: "text-base",
    titleText: "text-base font-semibold",
    gap: "gap-4",
    padding: "p-4",
  },
};

const variantConfig = {
  default: {
    activeClasses:
      "bg-primary border-primary text-primary-foreground shadow-lg ring-4 ring-primary/20",
    completedClasses:
      "bg-primary border-primary text-primary-foreground shadow-md",
    upcomingClasses:
      "bg-muted border-border text-muted-foreground hover:border-primary/50 hover:bg-muted/80",
    errorClasses:
      "bg-destructive/10 border-destructive/30 text-destructive shadow-sm",
  },
  navigation: {
    activeClasses:
      "bg-gradient-to-br from-primary to-primary/80 border-primary text-primary-foreground shadow-xl ring-4 ring-primary/20",
    completedClasses:
      "bg-primary/90 border-primary text-primary-foreground shadow-md",
    upcomingClasses:
      "bg-muted border-border text-muted-foreground hover:bg-muted/80 hover:border-primary/40",
    errorClasses:
      "bg-destructive/20 border-destructive text-destructive shadow-md",
  },
  minimal: {
    activeClasses:
      "bg-transparent border-b-2 border-primary text-primary font-semibold",
    completedClasses:
      "bg-transparent border-b-2 border-primary text-foreground",
    upcomingClasses:
      "bg-transparent border-b-2 border-transparent text-muted-foreground hover:border-border",
    errorClasses:
      "bg-transparent border-b-2 border-destructive text-destructive",
  },
  card: {
    activeClasses:
      "bg-primary/5 border-2 border-primary text-foreground shadow-lg ring-2 ring-primary/10",
    completedClasses:
      "bg-primary/10 border-2 border-primary/50 text-foreground shadow-sm",
    upcomingClasses:
      "bg-muted/30 border-2 border-border text-muted-foreground hover:bg-muted/50",
    errorClasses:
      "bg-destructive/5 border-2 border-destructive/50 text-destructive",
  },
};

const getConnectorStyle = (
  isFilled: boolean,
  isError = false,
  style: "solid" | "dashed" | "gradient" = "solid",
  customColor?: string,
) => {
  if (isError) {
    return {
      backgroundColor:
        style === "gradient" ? undefined : "hsl(var(--destructive) / 0.6)",
      backgroundImage:
        style === "dashed"
          ? "repeating-linear-gradient(90deg, hsl(var(--destructive) / 0.7) 0px, hsl(var(--destructive) / 0.7) 4px, transparent 4px, transparent 8px)"
          : style === "gradient"
            ? "linear-gradient(90deg, hsl(var(--destructive)) 0%, hsl(var(--destructive) / 0.6) 100%)"
            : undefined,
      boxShadow: "0 0 12px hsl(var(--destructive) / 0.4)",
    };
  }
  if (isFilled) {
    const colorValue = customColor || "hsl(var(--primary))";
    const colorValueDim = customColor
      ? `${customColor}CC`
      : "hsl(var(--primary) / 0.7)";
    const shadowColor = customColor
      ? `${customColor}99`
      : "hsl(var(--primary) / 0.6)";

    return {
      backgroundColor: style === "gradient" ? undefined : colorValue,
      backgroundImage:
        style === "dashed"
          ? `repeating-linear-gradient(90deg, ${colorValue} 0px, ${colorValue} 4px, transparent 4px, transparent 8px)`
          : style === "gradient"
            ? `linear-gradient(90deg, ${colorValue} 0%, ${colorValueDim} 100%)`
            : undefined,
      boxShadow: `0 0 12px ${shadowColor}`,
    };
  }
  return {
    backgroundColor: "hsl(var(--border))",
    boxShadow: "0 0 4px hsl(var(--border) / 0.3)",
  };
};

export const Steps: React.FC<StepsProps> = ({
  steps,
  currentStep,
  onStepClick,
  onChange,
  className,
  orientation = "horizontal",
  showProgressBar = true,
  showProgressPercentage = true,
  allowClickNavigation = true,
  size = "md",
  labelPlacement = "bottom",
  variant = "default",
  mobileLayout = "stack",
  connectorConfig = { show: true, animated: true, style: "solid" },
  cardClassName = "",
}) => {
  const [deviceType, setDeviceType] = useState<"mobile" | "tablet" | "desktop">(
    "desktop",
  );

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setDeviceType("mobile");
      } else if (width < 1024) {
        setDeviceType("tablet");
      } else {
        setDeviceType("desktop");
      }
    };
    checkScreenSize();
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkScreenSize, 150);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const stepStatus = useMemo(
    () => ({
      isCompleted: (stepIndex: number) => stepIndex < currentStep - 1,
      isActive: (stepIndex: number) => stepIndex === currentStep - 1,
      isUpcoming: (stepIndex: number) => stepIndex > currentStep - 1,
      isError: (stepIndex: number) => steps[stepIndex]?.status === "error",
      progressPercentage: ((currentStep - 1) / steps.length) * 100,
      allStepsCompleted: currentStep > steps.length,
    }),
    [currentStep, steps],
  );

  const handleStepClick = useCallback(
    (step: number) => {
      if (allowClickNavigation && !steps[step - 1]?.disabled) {
        onStepClick?.(step);
        onChange?.(step);
      }
    },
    [allowClickNavigation, onStepClick, onChange, steps],
  );

  const config = sizeConfig[size];
  const variantStyles = variantConfig[variant];

  const isConnectorFilled = (connectorIndex: number): boolean => {
    return connectorIndex < currentStep - 1;
  };

  if (deviceType === "mobile" && mobileLayout === "scroll") {
    return (
      <div className={cn("w-full space-y-4", className)}>
        {showProgressBar && (
          <div className="space-y-2.5 px-4">
            <div className="flex justify-between items-center gap-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Step {currentStep} of {steps.length}
              </span>
              {showProgressPercentage && (
                <Badge
                  variant="secondary"
                  className="text-xs font-semibold min-w-fit"
                >
                  {Math.round(stepStatus.progressPercentage)}%
                </Badge>
              )}
            </div>
            <Progress value={stepStatus.progressPercentage} className="h-2" />
          </div>
        )}

        <div className="relative">
          <div className="overflow-x-auto -mx-4 px-4 pb-2 snap-x snap-mandatory scrollbar-hide">
            <div className="flex gap-3 w-max">
              {steps.map((step, index) => (
                <React.Fragment key={index}>
                  <motion.button
                    onClick={() => handleStepClick(index + 1)}
                    disabled={step.disabled || !allowClickNavigation}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "shrink-0 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-2 px-3.5 py-3 snap-center",
                      "min-w-[85px] min-h-[75px] disabled:cursor-not-allowed disabled:opacity-50",
                      "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary active:scale-95",
                      stepStatus.isError(index)
                        ? "bg-destructive/10 border-destructive/40 text-destructive hover:bg-destructive/15"
                        : stepStatus.isCompleted(index)
                          ? "bg-primary border-primary text-primary-foreground shadow-md hover:shadow-lg"
                          : stepStatus.isActive(index)
                            ? "bg-primary/10 border-primary text-primary ring-2 ring-primary/30 shadow-sm"
                            : "bg-muted/60 border-border text-muted-foreground hover:bg-muted/80",
                      cardClassName,
                    )}
                  >
                    <div
                      className={cn(
                        "shrink-0 rounded-full flex items-center justify-center font-bold border-2 text-xs flex-none",
                        "w-7 h-7 transition-all",
                        stepStatus.isError(index)
                          ? "bg-destructive/15 border-destructive text-destructive"
                          : stepStatus.isCompleted(index)
                            ? "bg-primary border-primary text-primary-foreground"
                            : stepStatus.isActive(index)
                              ? "bg-primary border-primary text-primary-foreground"
                              : "bg-muted/70 border-border text-muted-foreground",
                      )}
                    >
                      {stepStatus.isCompleted(index) ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : stepStatus.isError(index) ? (
                        <AlertCircle className="w-3.5 h-3.5" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span className="text-xs font-semibold text-center line-clamp-2 leading-tight">
                      {step.title}
                    </span>
                  </motion.button>

                  {connectorConfig?.show !== false &&
                    index < steps.length - 1 && (
                      <div className="flex items-center justify-center shrink-0 px-1">
                        <motion.div
                          className="transition-all duration-500 ease-out block"
                          initial={{ scaleX: 0, opacity: 0 }}
                          animate={{ scaleX: 1, opacity: 1 }}
                          transition={{ delay: index * 0.08 + 0.1 }}
                          style={{
                            width: "28px",
                            height: "4px",
                            borderRadius: "2px",
                            ...getConnectorStyle(
                              isConnectorFilled(index),
                              stepStatus.isError(index) ||
                                stepStatus.isError(index + 1),
                              connectorConfig?.style || "solid",
                              connectorConfig?.color,
                            ),
                          }}
                        />
                      </div>
                    )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (deviceType === "mobile" && mobileLayout === "stack") {
    return (
      <div className={cn("w-full space-y-3", className)}>
        {showProgressBar && (
          <div className="space-y-2.5 px-4">
            <div className="flex justify-between items-center gap-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Step {currentStep} of {steps.length}
              </span>
              {showProgressPercentage && (
                <Badge
                  variant="secondary"
                  className="text-xs font-semibold min-w-fit"
                >
                  {Math.round(stepStatus.progressPercentage)}%
                </Badge>
              )}
            </div>
            <Progress value={stepStatus.progressPercentage} className="h-2" />
          </div>
        )}

        <div className="space-y-0 px-4">
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              <motion.button
                onClick={() => handleStepClick(index + 1)}
                disabled={step.disabled || !allowClickNavigation}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06 }}
                className={cn(
                  "w-full p-4 rounded-lg border-2 transition-all flex items-start gap-3.5 text-left relative group",
                  "disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] min-h-fit",
                  "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
                  stepStatus.isError(index)
                    ? "bg-destructive/10 border-destructive/40 hover:bg-destructive/15"
                    : stepStatus.isCompleted(index)
                      ? "bg-primary/10 border-primary hover:bg-primary/15 shadow-sm"
                      : stepStatus.isActive(index)
                        ? "bg-primary/5 border-primary ring-2 ring-primary/25 shadow-md"
                        : "bg-muted/40 border-border hover:bg-muted/60 hover:border-primary/20",
                  cardClassName,
                )}
              >
                <div
                  className={cn(
                    "shrink-0 rounded-full flex items-center justify-center font-bold border-2 text-xs flex-none",
                    "w-8 h-8 mt-0.5 transition-all",
                    stepStatus.isError(index)
                      ? "bg-destructive/15 border-destructive text-destructive"
                      : stepStatus.isCompleted(index)
                        ? "bg-primary border-primary text-primary-foreground"
                        : stepStatus.isActive(index)
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-muted border-border text-muted-foreground",
                  )}
                >
                  {stepStatus.isCompleted(index) ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : stepStatus.isError(index) ? (
                    <AlertCircle className="w-3.5 h-3.5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm leading-tight">
                    {step.title}
                  </h3>
                  {step.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  )}
                  {step.content && stepStatus.isActive(index) && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 text-xs text-foreground/80 bg-primary/5 p-2 rounded-md"
                    >
                      {step.content}
                    </motion.div>
                  )}
                </div>
              </motion.button>

              {connectorConfig?.show !== false && index < steps.length - 1 && (
                <motion.div
                  className="flex justify-start pl-4 py-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.08 + 0.1 }}
                >
                  <div
                    className="ml-3 transition-all duration-500 ease-out rounded-full"
                    style={{
                      width: "4px",
                      minHeight: "20px",
                      ...getConnectorStyle(
                        stepStatus.isCompleted(index),
                        stepStatus.isError(index),
                        connectorConfig?.style || "solid",
                        connectorConfig?.color,
                      ),
                    }}
                  />
                </motion.div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  if (deviceType === "tablet" && orientation === "horizontal") {
    return (
      <div className={cn("w-full", className)}>
        {showProgressBar && (
          <div className="mb-6 space-y-2.5">
            <div className="flex justify-between items-center px-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Progress
              </span>
              {showProgressPercentage && (
                <span className="text-xs font-bold text-foreground tabular-nums">
                  {Math.round(stepStatus.progressPercentage)}%
                </span>
              )}
            </div>
            <Progress value={stepStatus.progressPercentage} className="h-2" />
          </div>
        )}

        <div className="flex items-start justify-center gap-0 py-4">
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: index * 0.08,
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
                onClick={() => handleStepClick(index + 1)}
                className={cn(
                  "flex flex-col items-center relative shrink-0 pt-0",
                  "transition-opacity duration-200",
                  !step.disabled && allowClickNavigation
                    ? "cursor-pointer"
                    : "",
                )}
              >
                {stepStatus.isActive(index) && (
                  <motion.div
                    className="absolute inset-0 bg-primary/25 rounded-full blur-lg -z-10 scale-125"
                    animate={{ scale: [1.25, 1.35, 1.25] }}
                    transition={{
                      duration: 2.5,
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                  />
                )}

                <motion.div
                  whileHover={
                    !step.disabled && allowClickNavigation ? { scale: 1.1 } : {}
                  }
                  whileTap={
                    !step.disabled && allowClickNavigation
                      ? { scale: 0.92 }
                      : {}
                  }
                  className={cn(
                    "relative z-10 rounded-full flex items-center justify-center font-bold",
                    "transition-all duration-300 border-2",
                    "w-10 h-10 text-sm",
                    stepStatus.isError(index)
                      ? variantStyles.errorClasses
                      : stepStatus.isCompleted(index)
                        ? variantStyles.completedClasses
                        : stepStatus.isActive(index)
                          ? variantStyles.activeClasses
                          : variantStyles.upcomingClasses,
                    step.disabled ? "opacity-50 cursor-not-allowed" : "",
                  )}
                >
                  <AnimatePresence mode="wait">
                    {stepStatus.isError(index) ? (
                      <motion.div
                        key="error"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <AlertCircle className="w-4 h-4" />
                      </motion.div>
                    ) : stepStatus.isCompleted(index) ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 40,
                        }}
                      >
                        <Check className="w-4 h-4" />
                      </motion.div>
                    ) : step.icon ? (
                      <motion.div
                        key="icon"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        {step.icon}
                      </motion.div>
                    ) : (
                      <motion.span
                        key="number"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        {index + 1}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>

                {labelPlacement === "bottom" && (
                  <motion.div
                    className="mt-3 text-center max-w-[70px]"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 + 0.15 }}
                  >
                    <p
                      className={cn(
                        "text-xs font-medium transition-colors line-clamp-1",
                        stepStatus.isError(index)
                          ? "text-destructive"
                          : stepStatus.isActive(index) ||
                              stepStatus.isCompleted(index)
                            ? "text-foreground"
                            : "text-muted-foreground",
                      )}
                    >
                      {step.title}
                    </p>
                  </motion.div>
                )}
              </motion.div>

              {connectorConfig?.show !== false && index < steps.length - 1 && (
                <motion.div
                  style={{
                    position: "relative",
                    flex: "1 0 auto",
                    minWidth: "24px",
                    display: "flex",
                    alignItems: "center",
                  }}
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  <div
                    className="w-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      height: "5px",
                      ...getConnectorStyle(
                        isConnectorFilled(index),
                        stepStatus.isError(index) ||
                          stepStatus.isError(index + 1),
                        connectorConfig?.style || "solid",
                        connectorConfig?.color,
                      ),
                    }}
                  />
                </motion.div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  if (orientation === "horizontal") {
    return (
      <div className={cn("w-full", className)}>
        {showProgressBar && (
          <div className="mb-8 space-y-2.5">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Progress
              </span>
              {showProgressPercentage && (
                <span className="text-xs font-bold text-foreground tabular-nums">
                  {Math.round(stepStatus.progressPercentage)}%
                </span>
              )}
            </div>
            <Progress value={stepStatus.progressPercentage} className="h-2.5" />
          </div>
        )}

        <div className="flex items-start justify-center gap-0 py-6">
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: index * 0.08,
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
                onClick={() => handleStepClick(index + 1)}
                className={cn(
                  "flex flex-col items-center relative shrink-0 pt-0",
                  "transition-opacity duration-200",
                  !step.disabled && allowClickNavigation
                    ? "cursor-pointer"
                    : "",
                )}
              >
                {stepStatus.isActive(index) && (
                  <motion.div
                    className="absolute inset-0 bg-primary/25 rounded-full blur-xl -z-10 scale-150"
                    animate={{ scale: [1.5, 1.65, 1.5] }}
                    transition={{
                      duration: 2.5,
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                  />
                )}

                <motion.div
                  whileHover={
                    !step.disabled && allowClickNavigation
                      ? { scale: 1.12 }
                      : {}
                  }
                  whileTap={
                    !step.disabled && allowClickNavigation
                      ? { scale: 0.92 }
                      : {}
                  }
                  className={cn(
                    "relative z-10 rounded-full flex items-center justify-center font-bold",
                    "transition-all duration-300 border-2",
                    config.circle.desktop,
                    stepStatus.isError(index)
                      ? variantStyles.errorClasses
                      : stepStatus.isCompleted(index)
                        ? variantStyles.completedClasses
                        : stepStatus.isActive(index)
                          ? variantStyles.activeClasses
                          : variantStyles.upcomingClasses,
                    step.disabled ? "opacity-50 cursor-not-allowed" : "",
                  )}
                >
                  <AnimatePresence mode="wait">
                    {stepStatus.isError(index) ? (
                      <motion.div
                        key="error"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <AlertCircle className={config.icon} />
                      </motion.div>
                    ) : stepStatus.isCompleted(index) ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 40,
                        }}
                      >
                        <Check className={config.icon} />
                      </motion.div>
                    ) : step.icon ? (
                      <motion.div
                        key="icon"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        {step.icon}
                      </motion.div>
                    ) : (
                      <motion.span
                        key="number"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        {index + 1}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>

                {labelPlacement === "bottom" && (
                  <motion.div
                    className="mt-4 text-center max-w-[100px]"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 + 0.15 }}
                  >
                    <p
                      className={cn(
                        config.titleText,
                        "transition-colors",
                        stepStatus.isError(index)
                          ? "text-destructive"
                          : stepStatus.isActive(index) ||
                              stepStatus.isCompleted(index)
                            ? "text-foreground"
                            : "text-muted-foreground",
                      )}
                    >
                      {step.title}
                    </p>
                    {step.description && (
                      <p
                        className={cn(
                          config.text,
                          "mt-1 transition-colors",
                          stepStatus.isError(index)
                            ? "text-destructive/70"
                            : stepStatus.isActive(index) ||
                                stepStatus.isCompleted(index)
                              ? "text-foreground/70"
                              : "text-muted-foreground/70",
                        )}
                      >
                        {step.description}
                      </p>
                    )}
                  </motion.div>
                )}
              </motion.div>

              {connectorConfig?.show !== false && index < steps.length - 1 && (
                <motion.div
                  style={{
                    position: "relative",
                    top: "14px",
                    flex: "1 0 auto",
                    minWidth: "32px",
                    display: "flex",
                    alignItems: "center",
                  }}
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  <div
                    className="w-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      height: "7px",
                      ...getConnectorStyle(
                        isConnectorFilled(index),
                        stepStatus.isError(index) ||
                          stepStatus.isError(index + 1),
                        connectorConfig?.style || "solid",
                        connectorConfig?.color,
                      ),
                    }}
                  />
                </motion.div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full space-y-0", className)}>
      {showProgressBar && (
        <div className="mb-6 sm:mb-8 space-y-2.5">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Progress
            </span>
            {showProgressPercentage && (
              <span className="text-xs font-bold text-foreground tabular-nums">
                {Math.round(stepStatus.progressPercentage)}%
              </span>
            )}
          </div>
          <Progress value={stepStatus.progressPercentage} className="h-2.5" />
        </div>
      )}

      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: index * 0.1,
              type: "spring",
              stiffness: 300,
            }}
            onClick={() => handleStepClick(index + 1)}
            className={cn(
              "flex gap-3 sm:gap-4 pb-6 sm:pb-8 relative",
              !step.disabled && allowClickNavigation ? "cursor-pointer" : "",
              cardClassName,
            )}
          >
            <div className="flex flex-col items-center shrink-0 pt-0">
              <motion.div
                whileHover={
                  !step.disabled && allowClickNavigation ? { scale: 1.1 } : {}
                }
                className={cn(
                  "relative z-10 rounded-full flex items-center justify-center font-bold",
                  "transition-all duration-300 border-2",
                  deviceType === "mobile"
                    ? "w-8 h-8 text-sm"
                    : "w-9 h-9 text-base",
                  stepStatus.isError(index)
                    ? variantStyles.errorClasses
                    : stepStatus.isCompleted(index)
                      ? variantStyles.completedClasses
                      : stepStatus.isActive(index)
                        ? variantStyles.activeClasses
                        : variantStyles.upcomingClasses,
                  step.disabled ? "opacity-50 cursor-not-allowed" : "",
                )}
              >
                <AnimatePresence mode="wait">
                  {stepStatus.isCompleted(index) ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 40,
                      }}
                    >
                      <Check
                        className={
                          deviceType === "mobile" ? "w-4 h-4" : "w-4 h-4"
                        }
                      />
                    </motion.div>
                  ) : stepStatus.isError(index) ? (
                    <motion.div
                      key="error"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <AlertCircle
                        className={
                          deviceType === "mobile" ? "w-4 h-4" : "w-4 h-4"
                        }
                      />
                    </motion.div>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </AnimatePresence>
              </motion.div>

              {connectorConfig?.show !== false && index < steps.length - 1 && (
                <motion.div
                  className="rounded-full mt-2 transition-all duration-500 ease-out shrink-0"
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                  style={{
                    width: deviceType === "mobile" ? "5px" : "7px",
                    minHeight: deviceType === "mobile" ? "64px" : "72px",
                    ...getConnectorStyle(
                      stepStatus.isCompleted(index),
                      stepStatus.isError(index),
                      connectorConfig?.style || "solid",
                      connectorConfig?.color,
                    ),
                  }}
                />
              )}
            </div>

            <div className="flex-1 pt-0.5">
              <p
                className={cn(
                  "font-semibold transition-colors",
                  deviceType === "mobile" ? "text-sm" : "text-base",
                  stepStatus.isError(index)
                    ? "text-destructive"
                    : stepStatus.isActive(index) ||
                        stepStatus.isCompleted(index)
                      ? "text-foreground"
                      : "text-muted-foreground",
                )}
              >
                {step.title}
              </p>
              {step.description && (
                <p
                  className={cn(
                    "mt-0.5 transition-colors",
                    deviceType === "mobile" ? "text-xs" : "text-sm",
                    stepStatus.isError(index)
                      ? "text-destructive/70"
                      : stepStatus.isActive(index) ||
                          stepStatus.isCompleted(index)
                        ? "text-foreground/70"
                        : "text-muted-foreground/70",
                  )}
                >
                  {step.description}
                </p>
              )}
              {step.content && stepStatus.isActive(index) && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "mt-3 transition-colors",
                    deviceType === "mobile" ? "text-xs" : "text-sm",
                  )}
                >
                  {step.content}
                </motion.div>
              )}
            </div>
          </motion.div>
        </React.Fragment>
      ))}
    </div>
  );
};

import React from "react";
import { Button } from "@/components/ui/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("cursor-pointer rounded-full");

const iconVariants = cva("", {
  variants: {
    size: {
      default: "size-4",
      sm: "size-3.5",
      lg: "size-5",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

interface IconButtonProps
  extends React.ComponentPropsWithoutRef<"button">,
    VariantProps<typeof buttonVariants>,
    VariantProps<typeof iconVariants> {
  icon: React.ElementType;
  iconClassName?: string;
  variant?: "ghost" | "outline" | "default";
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, icon: Icon, iconClassName, size, variant, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant || "ghost"}
        size="icon"
        className={cn(buttonVariants(), className)}
        {...props}
      >
        <Icon className={cn(iconVariants({ size }), iconClassName)} />
      </Button>
    );
  },
);

IconButton.displayName = "IconButton";

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "glass" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] hover:-translate-y-0.5",
          {
            "bg-accent text-accent-foreground shadow-[0_0_20px_rgba(255,107,43,0.25)] hover:shadow-[0_0_30px_rgba(255,107,43,0.4)]":
              variant === "default",
            "border border-border/80 bg-background/70 backdrop-blur-md hover:bg-background hover:text-foreground":
              variant === "outline",
            "hover:bg-secondary/70": variant === "ghost",
            "glass hover:bg-white/10": variant === "glass",
            "bg-error text-white hover:bg-error/90": variant === "destructive",
            "h-12 px-6 py-2": size === "default",
            "h-9 rounded-lg px-4": size === "sm",
            "h-14 rounded-2xl px-10 text-base": size === "lg",
            "h-12 w-12": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };

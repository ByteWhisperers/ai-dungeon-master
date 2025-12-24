import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 font-display tracking-wide uppercase",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-[0_0_20px_hsl(var(--magic)/0.4)]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-border bg-transparent text-foreground hover:bg-secondary hover:border-primary/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-secondary hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        magic: "bg-gradient-to-r from-magic to-gold-light text-primary-foreground shadow-lg hover:shadow-[0_0_30px_hsl(var(--magic)/0.5)] hover:scale-105",
        combat: "bg-gradient-to-r from-combat to-orange-500 text-foreground shadow-lg hover:shadow-[0_0_30px_hsl(var(--combat)/0.5)] hover:scale-105",
        explore: "bg-gradient-to-r from-explore to-emerald-400 text-primary-foreground shadow-lg hover:shadow-[0_0_30px_hsl(var(--explore)/0.5)] hover:scale-105",
        narrative: "bg-gradient-to-r from-narrative to-purple-400 text-foreground shadow-lg hover:shadow-[0_0_30px_hsl(var(--narrative)/0.5)] hover:scale-105",
        hero: "bg-primary/90 text-primary-foreground border-2 border-gold/50 shadow-[0_0_30px_hsl(var(--magic)/0.3)] hover:shadow-[0_0_50px_hsl(var(--magic)/0.5)] hover:border-gold hover:scale-105",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-md px-8 text-base",
        xl: "h-14 rounded-lg px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

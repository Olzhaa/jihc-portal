import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Pill buttons that press in slightly on click and ease on the spring curve.
export const buttonVariants = cva(
  "group/btn inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-[background-color,color,box-shadow,transform] duration-300 ease-spring active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/25",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_6px_16px_-6px_color-mix(in_srgb,var(--primary)_60%,transparent)] hover:bg-primary/92",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70",
        outline: "bg-card text-foreground ring-1 ring-inset ring-foreground/10 hover:bg-muted",
        ghost: "hover:bg-muted",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        success: "bg-emerald-600 text-white hover:bg-emerald-700",
      },
      size: { default: "h-10 px-5", sm: "h-8 px-3.5 text-xs", lg: "h-12 px-6", icon: "h-10 w-10" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

/** Trailing icon in its own small circle, flush with the button's right edge ("button in button"). */
export function ButtonIcon({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "-mr-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-500 ease-spring group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-px group-hover/btn:scale-105 [&_svg]:h-3.5 [&_svg]:w-3.5",
        className,
      )}
    >
      {children}
    </span>
  );
}

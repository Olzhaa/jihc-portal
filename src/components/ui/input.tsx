import { cn } from "@/lib/utils";

const field =
  "flex h-10 w-full min-w-0 rounded-xl bg-card px-3.5 py-1 text-sm ring-1 ring-inset ring-foreground/10 transition-[box-shadow] duration-300 ease-spring placeholder:text-muted-foreground hover:ring-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:opacity-50";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(field, className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(field, "h-auto min-h-24 py-2.5", className)} {...props} />;
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(field, className)} {...props} />;
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium", className)} {...props} />;
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4 md:mb-9">
      <div className="min-w-0">
        {eyebrow && (
          <div className="eyebrow mb-3 inline-flex rounded-full bg-primary/8 px-3 py-1 text-primary ring-1 ring-inset ring-primary/15">{eyebrow}</div>
        )}
        <h1 className="text-[1.65rem] font-semibold leading-tight tracking-[-0.02em] md:text-[2rem]">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-muted-foreground md:text-[0.95rem]">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

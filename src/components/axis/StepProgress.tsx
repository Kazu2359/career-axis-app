const TOTAL_STEPS = 4;

export function StepProgress({
  step,
  label,
  percent,
}: {
  step: number;
  label: string;
  percent: number;
}) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted">
      <span className="shrink-0 font-medium tracking-wide">
        STEP {step}/{TOTAL_STEPS} &middot; {label}
      </span>
      <div className="h-1.5 flex-1 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </div>
  );
}

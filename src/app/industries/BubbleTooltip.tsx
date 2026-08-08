"use client";

import type { ReactNode } from "react";

export function BubbleTooltip({
  content,
  children,
}: {
  content: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="group/tip relative flex shrink-0">
      {children}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-56 -translate-x-1/2 scale-95 rounded-lg border border-border bg-panel px-3 py-2 text-left text-xs text-foreground opacity-0 shadow-lg transition-all duration-150 group-hover/tip:scale-100 group-hover/tip:opacity-100">
        {content}
      </div>
    </div>
  );
}

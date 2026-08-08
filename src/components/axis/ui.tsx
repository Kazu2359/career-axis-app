import type { ButtonHTMLAttributes, TextareaHTMLAttributes } from "react";

export function AxisShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-10">
      {children}
    </main>
  );
}

export function WideShell({
  children,
  className = "max-w-6xl",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main
      className={`mx-auto flex w-full flex-1 flex-col gap-6 px-5 py-10 ${className}`}
    >
      {children}
    </main>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm leading-snug text-muted">{label}</span>
      {children}
    </label>
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={
        "min-h-24 rounded-lg border border-border bg-panel px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent " +
        (props.className ?? "")
      }
    />
  );
}

export function PrimaryButton(
  props: ButtonHTMLAttributes<HTMLButtonElement>,
) {
  return (
    <button
      {...props}
      className={
        "inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity disabled:opacity-40 " +
        (props.className ?? "")
      }
    />
  );
}

export function SecondaryButton(
  props: ButtonHTMLAttributes<HTMLButtonElement>,
) {
  return (
    <button
      {...props}
      className={
        "inline-flex items-center justify-center rounded-lg border border-border bg-panel px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-accent disabled:opacity-40 " +
        (props.className ?? "")
      }
    />
  );
}

export function GhostButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        "inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:text-foreground disabled:opacity-40 " +
        (props.className ?? "")
      }
    />
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-warn bg-warn-soft px-3 py-2 text-sm text-warn">
      {message}
    </div>
  );
}

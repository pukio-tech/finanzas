import type { ComponentProps, ReactNode } from "react";

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// `flush` quita el relleno para listas cuyas filas ya traen el suyo.
export function Card({ className, flush, ...props }: ComponentProps<"div"> & { flush?: boolean }) {
  return (
    <div
      className={cx("rounded-2xl border border-border bg-surface", !flush && "p-4", className)}
      {...props}
    />
  );
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ variant = "secondary", className, ...props }: ButtonProps) {
  return (
    <button
      className={cx(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-medium transition active:scale-[0.98] disabled:opacity-60",
        variant === "primary" && "bg-accent text-accent-foreground",
        variant === "secondary" && "border border-border bg-surface hover:bg-surface-muted",
        variant === "ghost" && "hover:bg-surface-muted",
        className,
      )}
      {...props}
    />
  );
}

type FieldProps = ComponentProps<"input"> & {
  label: string;
  hint?: ReactNode;
};

export function Field({ label, hint, id, name, className, ...props }: FieldProps) {
  const inputId = id ?? name;
  return (
    <label htmlFor={inputId} className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-muted">{label}</span>
      <input
        id={inputId}
        name={name}
        className={cx(
          "min-h-12 rounded-xl border border-border bg-surface px-3.5 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25",
          className,
        )}
        {...props}
      />
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

// Monto en soles con teclado decimal en el celular.
export function MoneyInput({
  className,
  size = "md",
  ...props
}: Omit<ComponentProps<"input">, "size"> & { size?: "md" | "lg" }) {
  return (
    <div
      className={cx(
        "flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 transition focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25",
        size === "lg" ? "min-h-16" : "min-h-12",
        className,
      )}
    >
      <span className={cx("text-muted", size === "lg" && "text-2xl")}>S/</span>
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder="0.00"
        className={cx("w-full min-w-0 bg-transparent outline-none", size === "lg" && "text-3xl font-semibold")}
        {...props}
      />
    </div>
  );
}

export function Alert({ children, tone = "danger" }: { children: ReactNode; tone?: "danger" | "success" }) {
  return (
    <p
      role="alert"
      className={cx(
        "rounded-xl px-3.5 py-2.5 text-sm",
        tone === "danger" ? "bg-danger-soft text-danger" : "bg-success-soft text-success",
      )}
    >
      {children}
    </p>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
      <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
    </div>
  );
}

export { cx };

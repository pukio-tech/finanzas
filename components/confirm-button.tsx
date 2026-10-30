"use client";

import type { ReactNode } from "react";
import { useTransition } from "react";
import { cx } from "./ui";

// Botón que pide confirmación antes de ejecutar una acción de servidor.
export function ConfirmButton({
  action,
  message,
  children,
  className,
  label,
}: {
  action: () => Promise<void>;
  message: string;
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      aria-label={label}
      disabled={pending}
      className={cx("disabled:opacity-50", className)}
      onClick={() => {
        if (window.confirm(message)) startTransition(() => action());
      }}
    >
      {children}
    </button>
  );
}

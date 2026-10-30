"use client";

import type { ReactNode } from "react";
import { useId, useRef, useTransition } from "react";
import { CircleAlert, CircleHelp } from "lucide-react";
import { cx } from "./ui";

// Botón que pide confirmación en un diálogo propio (hoja inferior en celular,
// ventana centrada en escritorio) antes de ejecutar una acción de servidor.
export function ConfirmButton({
  action,
  message,
  children,
  className,
  label,
  titulo,
  confirmar = "Eliminar",
  tono = "danger",
}: {
  action: () => Promise<void>;
  message: string;
  children: ReactNode;
  className?: string;
  label?: string;
  titulo?: string;
  confirmar?: string;
  tono?: "danger" | "accent";
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tituloId = useId();
  const [pending, startTransition] = useTransition();
  const Icono = tono === "danger" ? CircleAlert : CircleHelp;

  const cerrar = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        disabled={pending}
        className={cx("disabled:opacity-50", className)}
        onClick={() => dialogRef.current?.showModal()}
      >
        {children}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={tituloId}
        // Clic fuera del contenido (en el fondo oscuro) cierra el diálogo.
        onClick={(e) => {
          if (e.target === e.currentTarget) cerrar();
        }}
        className={cx(
          "m-0 mt-auto w-full max-w-none bg-transparent p-0 text-foreground backdrop:bg-black/45",
          "md:m-auto md:max-w-sm",
        )}
      >
        <div className="flex flex-col gap-4 rounded-t-3xl border border-border bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:rounded-2xl md:pb-5">
          <div className="mx-auto h-1 w-10 rounded-full bg-border md:hidden" aria-hidden />
          <div className="flex gap-3">
            <span
              className={cx(
                "flex size-10 shrink-0 items-center justify-center rounded-full",
                tono === "danger" ? "bg-danger-soft text-danger" : "bg-accent-soft text-accent",
              )}
            >
              <Icono className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p id={tituloId} className="font-semibold">{titulo ?? (tono === "danger" ? "¿Seguro?" : "Confirmar")}</p>
              <p className="mt-1 text-sm text-muted">{message}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={cerrar}
              autoFocus
              className="min-h-12 rounded-xl border border-border bg-surface font-medium active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await action();
                  cerrar();
                })
              }
              className={cx(
                "min-h-12 rounded-xl font-medium active:scale-[0.98] disabled:opacity-60",
                tono === "danger" ? "bg-danger text-white" : "bg-accent text-accent-foreground",
              )}
            >
              {pending ? "Un momento…" : confirmar}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

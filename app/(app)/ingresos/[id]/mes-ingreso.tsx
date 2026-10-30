"use client";

import { useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { useFormAction } from "@/components/use-form-action";
import { Alert, Button, MoneyInput, cx } from "@/components/ui";
import type { MesIngreso } from "@/lib/ingresos";
import { formatSoles, nombreMes } from "@/lib/format";
import { ajustarMes } from "../actions";

// Fila de un mes: cuánto se esperaba, cuánto se cobró y cuánto falta. Se abre para cambiar el monto.
export function MesIngresoFila({ ingresoId, mes }: { ingresoId: string; mes: MesIngreso }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const { state, pending, onSubmit } = useFormAction(ajustarMes.bind(null, ingresoId, mes.anio, mes.mes));
  useEffect(() => {
    if (state.ok && detailsRef.current) detailsRef.current.open = false;
  }, [state]);

  const futuro = !mes.vencido && !mes.actual;
  const estado =
    mes.esperado === 0
      ? { texto: "Sin ingreso", clase: "text-muted" }
      : mes.falta === 0
        ? { texto: "Cobrado", clase: "text-success" }
        : mes.recibido > 0
          ? { texto: `Cobraste ${formatSoles(mes.recibido)} · faltan ${formatSoles(mes.falta)}`, clase: mes.vencido ? "text-warning" : "text-muted" }
          : { texto: futuro ? "Por cobrar" : `Faltan ${formatSoles(mes.falta)}`, clase: mes.vencido ? "text-warning" : "text-muted" };

  return (
    <details ref={detailsRef} className={cx("group rounded-2xl border bg-surface", mes.actual ? "border-accent" : "border-border")}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <p className="font-medium">
            {nombreMes(mes.mes)} {mes.anio}
            {mes.actual && (
              <span className="ml-2 rounded-md bg-accent-soft px-1.5 py-0.5 text-[11px] font-medium text-accent">Este mes</span>
            )}
          </p>
          <p className={cx("text-xs", estado.clase)}>{estado.texto}</p>
        </div>
        <span className={cx("shrink-0 font-semibold", mes.falta === 0 && mes.esperado > 0 && "text-success", futuro && "text-muted")}>
          {formatSoles(mes.esperado)}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted transition group-open:rotate-180" aria-hidden />
      </summary>
      <form onSubmit={onSubmit} className="flex flex-col gap-2 border-t border-border p-4">
        <label htmlFor={`monto-${mes.anio}-${mes.mes}`} className="text-sm font-medium text-muted">
          Monto de este mes {mes.ajustado && <span className="font-normal">(cambiado)</span>}
        </label>
        <div className="flex gap-2">
          <MoneyInput id={`monto-${mes.anio}-${mes.mes}`} name="monto" defaultValue={mes.esperado.toFixed(2)} className="flex-1" />
          <Button type="submit" variant="primary" disabled={pending}>
            Guardar
          </Button>
        </div>
        <p className="text-xs text-muted">Pon 0 si ese mes no recibes este ingreso.</p>
        {state.error && <Alert>{state.error}</Alert>}
      </form>
    </details>
  );
}

"use client";

import { useActionState, useEffect, useRef } from "react";
import { CalendarPlus, ChevronDown, Trash2 } from "lucide-react";
import { ConfirmButton } from "@/components/confirm-button";
import { Alert, Button, Card, MoneyInput, cx } from "@/components/ui";
import type { EstadoPeriodo } from "@/lib/cuotas";
import { formatSoles, nombreMes } from "@/lib/format";
import type { FormState } from "@/lib/validacion";
import { actualizarMontoMes, agregarMeses, eliminarMes } from "../actions";

export function MesEditable({
  cuotaId,
  periodo,
  participantes,
}: {
  cuotaId: string;
  periodo: EstadoPeriodo;
  participantes: { id: string; nombre: string }[];
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [state, action, pending] = useActionState<FormState, FormData>(
    actualizarMontoMes.bind(null, cuotaId, periodo.id!),
    {},
  );
  useEffect(() => {
    if (state.ok && detailsRef.current) detailsRef.current.open = false;
  }, [state]);

  const completo = periodo.faltante === 0;

  return (
    <details
      ref={detailsRef}
      className={cx(
        "group rounded-2xl border bg-surface",
        periodo.actual ? "border-accent" : "border-border",
      )}
    >
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <p className="font-medium">
            {nombreMes(periodo.mes)} {periodo.anio}
            {periodo.actual && (
              <span className="ml-2 rounded-md bg-accent-soft px-1.5 py-0.5 text-[11px] font-medium text-accent">Este mes</span>
            )}
          </p>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
            {periodo.participantes.map((e) => {
              const p = participantes.find((x) => x.id === e.participanteId);
              return (
                <span
                  key={e.participanteId}
                  className={cx(
                    e.faltante === 0 ? "text-success" : periodo.vencido ? "text-warning" : "text-muted",
                  )}
                >
                  {p?.nombre}: {e.faltante === 0 ? "pagado" : `falta ${formatSoles(e.faltante)}`}
                </span>
              );
            })}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className={cx("font-semibold", completo && "text-success")}>{formatSoles(periodo.monto)}</p>
        </div>
        <ChevronDown className="size-4 shrink-0 text-muted transition group-open:rotate-180" aria-hidden />
      </summary>

      <div className="flex flex-col gap-3 border-t border-border p-4">
        <form action={action} className="flex flex-col gap-2">
          <label htmlFor={`monto-${periodo.id}`} className="text-sm font-medium text-muted">
            Monto total del mes
          </label>
          <div className="flex gap-2">
            <MoneyInput
              id={`monto-${periodo.id}`}
              name="monto"
              defaultValue={state.values?.monto ?? periodo.monto.toFixed(2)}
              className="flex-1"
              required
            />
            <Button type="submit" variant="primary" disabled={pending}>
              Guardar
            </Button>
          </div>
          {state.error && <Alert>{state.error}</Alert>}
        </form>
        <ConfirmButton
          action={eliminarMes.bind(null, cuotaId, periodo.id!)}
          message={`¿Quitar ${nombreMes(periodo.mes)} ${periodo.anio} de la cuota?`}
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm text-danger hover:bg-danger-soft"
        >
          <Trash2 className="size-4" aria-hidden />
          Quitar este mes
        </ConfirmButton>
      </div>
    </details>
  );
}

export function AgregarMesesForm({ cuotaId, montoSugerido }: { cuotaId: string; montoSugerido: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(agregarMeses.bind(null, cuotaId), {});

  return (
    <Card>
      <form action={action} className="flex flex-col gap-3">
        <p className="flex items-center gap-2 font-medium">
          <CalendarPlus className="size-5 text-muted" aria-hidden />
          Agregar meses
        </p>
        <div className="grid grid-cols-[5.5rem_1fr] gap-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Cantidad</span>
            <input
              name="meses"
              type="number"
              inputMode="numeric"
              min={1}
              max={36}
              defaultValue={state.values?.meses ?? 6}
              className="min-h-12 rounded-xl border border-border bg-surface px-3 outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Monto por mes</span>
            <MoneyInput
              name="monto"
              defaultValue={state.values?.monto ?? (montoSugerido ? montoSugerido.toFixed(2) : "")}
              required
            />
          </label>
        </div>
        {state.error && <Alert>{state.error}</Alert>}
        {state.ok && !pending && <Alert tone="success">Meses agregados</Alert>}
        <Button type="submit" disabled={pending}>
          {pending ? "Agregando…" : "Agregar"}
        </Button>
      </form>
    </Card>
  );
}

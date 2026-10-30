"use client";

import { useState } from "react";
import { useFormAction } from "@/components/use-form-action";
import { Alert, Button, Card, Field, MoneyInput } from "@/components/ui";
import { formatSoles } from "@/lib/format";
import { registrarCobro } from "../../actions";

export function CobroForm({
  ingresoId,
  sugerencias,
  hoy,
}: {
  ingresoId: string;
  sugerencias: { label: string; valor: number }[];
  hoy: string;
}) {
  const { state, pending, onSubmit } = useFormAction(registrarCobro.bind(null, ingresoId));
  const [monto, setMonto] = useState("");

  return (
    <form onSubmit={onSubmit} className="grid items-start gap-5 lg:grid-cols-2 lg:gap-x-8">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="monto" className="text-sm font-medium text-muted">
            ¿Cuánto te pagaron?
          </label>
          <MoneyInput id="monto" name="monto" size="lg" value={monto} onChange={(e) => setMonto(e.target.value)} autoFocus required />
          {sugerencias.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {sugerencias.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setMonto(s.valor.toFixed(2))}
                  className="min-h-10 rounded-full border border-border bg-surface px-3.5 text-sm active:scale-95"
                >
                  {s.label}: <span className="font-medium">{formatSoles(s.valor)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <Card className="flex flex-col gap-4">
          <Field label="Fecha" name="fecha" type="date" defaultValue={hoy} max={hoy} required />
          <Field label="Nota (opcional)" name="nota" placeholder="Transferencia del jefe" maxLength={200} />
        </Card>

        {state.error && <Alert>{state.error}</Alert>}

        <Button type="submit" variant="primary" disabled={pending} className="min-h-12 w-full">
          {pending ? "Guardando…" : "Guardar cobro"}
        </Button>
      </div>
    </form>
  );
}

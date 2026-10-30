"use client";

import { useFormAction } from "./use-form-action";
import { Alert, Button, Card, Field, MoneyInput } from "./ui";
import type { FormState } from "@/lib/validacion";

// Formulario corto de monto + fecha + nota: aportes a metas y abonos a deudas.
export function MovimientoForm({
  action,
  titulo,
  boton,
  hoy,
  montoSugerido,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  titulo: string;
  boton: string;
  hoy: string;
  montoSugerido?: number;
}) {
  const { state, pending, formRef, onSubmit } = useFormAction(action);

  return (
    <Card>
      <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-3">
        <p className="font-medium">{titulo}</p>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-muted">Monto</span>
            <MoneyInput name="monto" required placeholder={montoSugerido ? montoSugerido.toFixed(2) : "0.00"} />
          </label>
          <Field label="Fecha" name="fecha" type="date" defaultValue={hoy} max={hoy} required className="min-w-0" />
        </div>
        <Field label="Nota (opcional)" name="nota" maxLength={200} placeholder="De la gratificación" />
        {state.error && <Alert>{state.error}</Alert>}
        {state.ok && !pending && <Alert tone="success">Guardado</Alert>}
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Guardando…" : boton}
        </Button>
      </form>
    </Card>
  );
}

"use client";

import { useFormAction } from "@/components/use-form-action";
import { Alert, Button, Card, Field, MoneyInput } from "@/components/ui";
import type { FormState } from "@/lib/validacion";

export type IngresoInicial = { nombre: string; monto: string; desde: string; hasta: string };

export function IngresoForm({
  action,
  inicial,
  modo,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  inicial: IngresoInicial;
  modo: "crear" | "editar";
}) {
  const { state, pending, onSubmit } = useFormAction(action);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Card className="flex flex-col gap-4">
        <Field label="¿De dónde viene?" name="nombre" defaultValue={inicial.nombre} placeholder="Sueldo del trabajo" maxLength={80} required />
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-muted">¿Cuánto recibes al mes?</span>
          <MoneyInput name="monto" defaultValue={inicial.monto} placeholder="900.00" required />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Desde" name="desde" type="month" defaultValue={inicial.desde} required className="min-w-0" />
          <Field label="Hasta (opcional)" name="hasta" type="month" defaultValue={inicial.hasta} className="min-w-0" />
        </div>
        <p className="text-xs text-muted">
          Cada mes se espera este monto. Si un mes cambia, lo ajustas desde el detalle del ingreso.
        </p>
      </Card>

      {state.error && <Alert>{state.error}</Alert>}

      <Button type="submit" variant="primary" disabled={pending} className="min-h-12 w-full">
        {pending ? "Guardando…" : modo === "crear" ? "Guardar ingreso" : "Guardar cambios"}
      </Button>
    </form>
  );
}

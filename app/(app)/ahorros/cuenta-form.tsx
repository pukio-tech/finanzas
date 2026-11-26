"use client";

import { useFormAction } from "@/components/use-form-action";
import { Alert, Button, Card, Field, MoneyInput } from "@/components/ui";
import type { FormState } from "@/lib/validacion";

export function CuentaForm({
  action,
  nombre = "",
  modo,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  nombre?: string;
  modo: "crear" | "editar";
}) {
  const { state, pending, onSubmit } = useFormAction(action);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Card className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-x-6">
        <Field label="Nombre" name="nombre" defaultValue={nombre} placeholder="PEYA, Detracciones…" maxLength={80} required />
        {modo === "crear" && (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted">¿Cuánto tienes ahí ahora? (opcional)</span>
              <MoneyInput name="saldo" placeholder="0.00" />
            </label>
            <p className="text-xs text-muted lg:col-span-2">
              Cada vez que te llegue plata la agregas tú, con el monto que sea. No se suma a tu sueldo ni a tu dinero libre.
            </p>
          </>
        )}
      </Card>

      {state.error && <Alert>{state.error}</Alert>}

      <Button type="submit" variant="primary" disabled={pending} className="min-h-12 w-full lg:w-64 lg:self-end">
        {pending ? "Guardando…" : modo === "crear" ? "Crear cuenta" : "Guardar cambios"}
      </Button>
    </form>
  );
}

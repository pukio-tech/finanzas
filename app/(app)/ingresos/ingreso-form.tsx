"use client";

import { useState } from "react";
import { useFormAction } from "@/components/use-form-action";
import { Alert, Button, Card, Field, MoneyInput } from "@/components/ui";
import { formatSoles } from "@/lib/format";
import type { FormState } from "@/lib/validacion";

export type IngresoInicial = { nombre: string; monto: string; desde: string; hasta: string; aparte: boolean };

export function IngresoForm({
  action,
  inicial,
  modo,
  cobrado = 0,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  inicial: IngresoInicial;
  modo: "crear" | "editar";
  cobrado?: number;
}) {
  const { state, pending, onSubmit } = useFormAction(action);
  const [aparte, setAparte] = useState(inicial.aparte);
  const cambia = modo === "editar" && aparte !== inicial.aparte && cobrado > 0;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Card className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-x-6">
        <Field label="¿De dónde viene?" name="nombre" defaultValue={inicial.nombre} placeholder="Sueldo del trabajo" maxLength={80} required />
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-muted">¿Cuánto recibes al mes?</span>
          <MoneyInput name="monto" defaultValue={inicial.monto} placeholder="900.00" required />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Desde" name="desde" type="month" defaultValue={inicial.desde} required className="min-w-0" />
          <Field label="Hasta (opcional)" name="hasta" type="month" defaultValue={inicial.hasta} className="min-w-0" />
        </div>
        <p className="text-xs text-muted lg:col-span-2">
          Cada mes se espera este monto. Si un mes cambia, lo ajustas desde el detalle del ingreso.
        </p>
      </Card>

      <Card className="flex flex-col gap-2">
        <label className="flex min-h-11 cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="aparte"
            checked={aparte}
            onChange={(e) => setAparte(e.target.checked)}
            className="mt-0.5 size-4.5 shrink-0 accent-[var(--accent)]"
          />
          <span>
            <span className="font-medium">Llevarlo en una cuenta aparte</span>
            <span className="mt-0.5 block text-sm text-muted">
              No se suma a tu sueldo, a tu dinero libre ni a la proyección. En el inicio sale en su propia tarjeta.
            </span>
          </span>
        </label>
        {cambia && (
          <p className="rounded-[10px] bg-surface-muted px-3 py-2 text-sm">
            {aparte
              ? `Lo que ya cobraste de este ingreso (${formatSoles(cobrado)}) saldrá de tu dinero libre.`
              : `Lo que ya cobraste de este ingreso (${formatSoles(cobrado)}) volverá a tu dinero libre.`}
          </p>
        )}
      </Card>

      {state.error && <Alert>{state.error}</Alert>}

      <Button type="submit" variant="primary" disabled={pending} className="min-h-12 w-full lg:w-64 lg:self-end">
        {pending ? "Guardando…" : modo === "crear" ? "Guardar ingreso" : "Guardar cambios"}
      </Button>
    </form>
  );
}

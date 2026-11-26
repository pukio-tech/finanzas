"use client";

import { BancoLogo } from "@/components/banco-logo";
import { useFormAction } from "@/components/use-form-action";
import { Alert, Button, Card, Field, MoneyInput } from "@/components/ui";
import { BANCOS, IDS_BANCOS } from "@/lib/bancos";
import type { FormState } from "@/lib/validacion";

export function CuentaForm({
  action,
  nombre = "",
  banco = null,
  modo,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  nombre?: string;
  banco?: string | null;
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

      <Card>
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-sm font-medium text-muted">¿En qué banco está?</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            <OpcionBanco valor="" nombre="Sin indicar" banco={null} marcado={!banco} />
            {IDS_BANCOS.map((id) => (
              <OpcionBanco key={id} valor={id} nombre={BANCOS[id].nombre} banco={id} marcado={banco === id} />
            ))}
          </div>
        </fieldset>
      </Card>

      {state.error && <Alert>{state.error}</Alert>}

      <Button type="submit" variant="primary" disabled={pending} className="min-h-12 w-full lg:w-64 lg:self-end">
        {pending ? "Guardando…" : modo === "crear" ? "Crear cuenta" : "Guardar cambios"}
      </Button>
    </form>
  );
}

function OpcionBanco({
  valor,
  nombre,
  banco,
  marcado,
}: {
  valor: string;
  nombre: string;
  banco: string | null;
  marcado: boolean;
}) {
  return (
    <label className="flex min-h-14 cursor-pointer items-center gap-2.5 rounded-[10px] border border-border px-2.5 py-2 text-sm transition-[color,background-color,border-color] hover:bg-surface-muted has-checked:border-accent has-checked:bg-accent-soft has-checked:font-medium has-focus-visible:ring-2 has-focus-visible:ring-accent/25">
      <input type="radio" name="banco" value={valor} defaultChecked={marcado} className="sr-only" />
      <BancoLogo banco={banco} className="size-8" />
      <span className="min-w-0 leading-tight">{nombre}</span>
    </label>
  );
}

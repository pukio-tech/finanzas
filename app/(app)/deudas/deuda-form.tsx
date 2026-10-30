"use client";

import { useState } from "react";
import { useFormAction } from "@/components/use-form-action";
import { Alert, Button, Card, Field, MoneyInput, cx } from "@/components/ui";
import type { FormState } from "@/lib/validacion";

export type DeudaInicial = {
  tipo: "DEBO" | "ME_DEBEN";
  contraparte: string;
  descripcion: string;
  monto: string;
  fecha: string;
  fechaLimite: string;
};

const TIPOS = [
  { value: "DEBO", label: "Yo debo", ayuda: "Le debo a alguien" },
  { value: "ME_DEBEN", label: "Me deben", ayuda: "Alguien me debe" },
] as const;

export function DeudaForm({
  action,
  inicial,
  modo,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  inicial: DeudaInicial;
  modo: "crear" | "editar";
}) {
  const { state, pending, onSubmit } = useFormAction(action);
  const [tipo, setTipo] = useState(inicial.tipo);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-muted">¿Quién le debe a quién?</legend>
        <input type="hidden" name="tipo" value={tipo} />
        <div className="grid grid-cols-2 gap-2">
          {TIPOS.map((t) => (
            <button
              key={t.value}
              type="button"
              aria-pressed={tipo === t.value}
              onClick={() => setTipo(t.value)}
              className={cx(
                "flex min-h-14 flex-col justify-center rounded-xl border px-3.5 text-left transition active:scale-[0.98]",
                tipo === t.value ? "border-accent bg-accent-soft" : "border-border bg-surface",
              )}
            >
              <span className={cx("font-medium", tipo === t.value && "text-accent")}>{t.label}</span>
              <span className="text-xs text-muted">{t.ayuda}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <Card className="flex flex-col gap-4">
        <Field
          label={tipo === "DEBO" ? "¿A quién le debes?" : "¿Quién te debe?"}
          name="contraparte"
          defaultValue={inicial.contraparte}
          placeholder="Jhon"
          maxLength={80}
          required
        />
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-muted">Monto total</span>
          <MoneyInput name="monto" defaultValue={inicial.monto} placeholder="500.00" required />
        </label>
        <Field label="Detalle (opcional)" name="descripcion" defaultValue={inicial.descripcion} placeholder="Préstamo para el pasaje" maxLength={200} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha" name="fecha" type="date" defaultValue={inicial.fecha} required className="min-w-0" />
          <Field label="Pagar hasta (opcional)" name="fechaLimite" type="date" defaultValue={inicial.fechaLimite} className="min-w-0" />
        </div>
      </Card>

      {state.error && <Alert>{state.error}</Alert>}

      <Button type="submit" variant="primary" disabled={pending} className="min-h-12 w-full">
        {pending ? "Guardando…" : modo === "crear" ? "Guardar deuda" : "Guardar cambios"}
      </Button>
    </form>
  );
}

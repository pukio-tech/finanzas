"use client";

import { useState } from "react";
import { CategoriaIcono, ICONOS_META } from "@/components/categoria-icono";
import { useFormAction } from "@/components/use-form-action";
import { Alert, Button, Card, Field, MoneyInput, cx } from "@/components/ui";
import type { FormState } from "@/lib/validacion";

const PRIORIDADES = [
  { value: "1", label: "Alta" },
  { value: "2", label: "Media" },
  { value: "3", label: "Baja" },
];

export type MetaInicial = {
  nombre: string;
  monto: string;
  prioridad: string;
  fechaObjetivo: string;
  icono: string;
  notas: string;
};

export function MetaForm({
  action,
  inicial,
  modo,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  inicial: MetaInicial;
  modo: "crear" | "editar";
}) {
  const { state, pending, onSubmit } = useFormAction(action);
  const [icono, setIcono] = useState(inicial.icono);
  const [prioridad, setPrioridad] = useState(inicial.prioridad);

  return (
    <form onSubmit={onSubmit} className="grid items-start gap-5 lg:grid-cols-2 lg:gap-x-8">
      <div className="flex flex-col gap-5">
        <Card className="flex flex-col gap-4">
          <Field label="¿Qué quieres comprar o pagar?" name="nombre" defaultValue={inicial.nombre} placeholder="Laptop" maxLength={80} required />
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-muted">¿Cuánto cuesta?</span>
            <MoneyInput name="monto" defaultValue={inicial.monto} placeholder="2900.00" required />
          </label>
          <Field
            label="¿Para cuándo? (opcional)"
            name="fechaObjetivo"
            type="date"
            defaultValue={inicial.fechaObjetivo}
            hint="Con una fecha se calcula cuánto ahorrar al mes."
          />
        </Card>
      </div>

      <div className="flex flex-col gap-5">
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-muted">Prioridad</legend>
          <input type="hidden" name="prioridad" value={prioridad} />
          <div className="grid grid-cols-3 gap-2">
            {PRIORIDADES.map((p) => (
              <button
                key={p.value}
                type="button"
                aria-pressed={prioridad === p.value}
                onClick={() => setPrioridad(p.value)}
                className={cx(
                  "min-h-11 rounded-xl border text-sm transition active:scale-95",
                  prioridad === p.value ? "border-accent bg-accent-soft font-medium text-accent" : "border-border bg-surface",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-muted">Icono</legend>
          <input type="hidden" name="icono" value={icono} />
          <div className="grid grid-cols-5 gap-2">
            {ICONOS_META.map((nombre) => (
              <button
                key={nombre}
                type="button"
                aria-pressed={icono === nombre}
                aria-label={nombre}
                onClick={() => setIcono(nombre)}
                className={cx(
                  "flex aspect-square items-center justify-center rounded-xl border transition active:scale-95",
                  icono === nombre ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface text-muted",
                )}
              >
                <CategoriaIcono nombre={nombre} className="size-6" />
              </button>
            ))}
          </div>
        </fieldset>

        <Field label="Notas (opcional)" name="notas" defaultValue={inicial.notas} placeholder="Modelo, tienda, link…" maxLength={200} />

        {state.error && <Alert>{state.error}</Alert>}

        <Button type="submit" variant="primary" disabled={pending} className="min-h-12 w-full">
          {pending ? "Guardando…" : modo === "crear" ? "Crear meta" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}

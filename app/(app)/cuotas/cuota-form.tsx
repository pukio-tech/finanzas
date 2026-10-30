"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";
import { Alert, Button, Card, Field, MoneyInput, cx } from "@/components/ui";
import type { FormState } from "@/lib/validacion";

type ParticipanteForm = { key: string; id?: string; nombre: string; porcentaje: string; esPropio: boolean };

let siguienteKey = 0;
const nuevaKey = () => `nuevo-${siguienteKey++}`;

// Formulario para crear (con monto y meses) o editar una cuota.
export function CuotaForm({
  action,
  modo,
  concepto = "",
  participantesIniciales,
  mesInicial,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  modo: "crear" | "editar";
  concepto?: string;
  participantesIniciales: Omit<ParticipanteForm, "key">[];
  mesInicial?: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  const [participantes, setParticipantes] = useState<ParticipanteForm[]>(() =>
    participantesIniciales.map((p) => ({ ...p, key: p.id ?? nuevaKey() })),
  );

  const suma = participantes.reduce((s, p) => s + (Number(p.porcentaje.replace(",", ".")) || 0), 0);
  const sumaOk = Math.abs(suma - 100) < 0.01;

  const actualizar = (key: string, cambios: Partial<ParticipanteForm>) =>
    setParticipantes((ps) => ps.map((p) => (p.key === key ? { ...p, ...cambios } : p)));

  const repartirIgual = () =>
    setParticipantes((ps) => {
      const base = Math.floor((100 / ps.length) * 100) / 100;
      return ps.map((p, i) => ({
        ...p,
        porcentaje: String(i === ps.length - 1 ? Math.round((100 - base * (ps.length - 1)) * 100) / 100 : base),
      }));
    });

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Card className="flex flex-col gap-4">
        <Field
          label="Nombre de la cuota"
          name="concepto"
          defaultValue={state.values?.concepto ?? concepto}
          placeholder="Alquiler del departamento"
          maxLength={80}
          required
        />
        {modo === "crear" && (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted">Monto total al mes</span>
              <MoneyInput name="monto" placeholder="1800.00" defaultValue={state.values?.monto} required />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Desde" name="desde" type="month" defaultValue={state.values?.desde ?? mesInicial} required />
              <Field label="Meses" name="meses" type="number" inputMode="numeric" min={1} max={60} defaultValue={state.values?.meses ?? 12} required />
            </div>
          </>
        )}
      </Card>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold">¿Entre quiénes se paga?</h2>
          <button type="button" onClick={repartirIgual} className="min-h-11 px-1 text-sm text-accent">
            Repartir igual
          </button>
        </div>

        <Card flush className="divide-y divide-border">
          {participantes.map((p) => (
            <div key={p.key} className="flex items-center gap-2 p-3">
              <input type="hidden" name="participante_id" value={p.id ?? ""} />
              <input
                name="participante_nombre"
                value={p.nombre}
                onChange={(e) => actualizar(p.key, { nombre: e.target.value })}
                placeholder="Nombre"
                aria-label="Nombre del participante"
                maxLength={60}
                required
                className="min-h-12 min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 outline-none focus:border-accent"
              />
              <div className="flex min-h-12 w-24 items-center rounded-xl border border-border bg-surface px-3 focus-within:border-accent">
                <input
                  name="participante_porcentaje"
                  value={p.porcentaje}
                  onChange={(e) => actualizar(p.key, { porcentaje: e.target.value })}
                  inputMode="decimal"
                  aria-label={`Porcentaje de ${p.nombre || "participante"}`}
                  required
                  className="w-full min-w-0 bg-transparent outline-none"
                />
                <span className="text-muted">%</span>
              </div>
              {p.esPropio ? (
                <span className="w-11 text-center text-xs text-muted">Tú</span>
              ) : (
                <button
                  type="button"
                  onClick={() => setParticipantes((ps) => ps.filter((x) => x.key !== p.key))}
                  aria-label={`Quitar a ${p.nombre || "participante"}`}
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-surface-muted hover:text-danger"
                >
                  <X className="size-5" aria-hidden />
                </button>
              )}
            </div>
          ))}
        </Card>

        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              setParticipantes((ps) => [...ps, { key: nuevaKey(), nombre: "", porcentaje: "", esPropio: false }])
            }
            disabled={participantes.length >= 10}
            className="-ml-2 text-accent"
          >
            <Plus className="size-5" aria-hidden />
            Agregar persona
          </Button>
          <span className={cx("text-sm", sumaOk ? "text-success" : "text-warning")}>
            Total: {Math.round(suma * 100) / 100}%
          </span>
        </div>
      </section>

      {state.error && <Alert>{state.error}</Alert>}

      <Button type="submit" variant="primary" disabled={pending} className="min-h-12 w-full">
        {pending ? "Guardando…" : modo === "crear" ? "Crear cuota" : "Guardar cambios"}
      </Button>
    </form>
  );
}

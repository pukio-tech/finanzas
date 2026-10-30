"use client";

import { useActionState, useState } from "react";
import { Alert, Button, Card, Field, MoneyInput, cx } from "@/components/ui";
import { formatSoles } from "@/lib/format";
import type { FormState } from "@/lib/validacion";
import { registrarPagoCuota } from "../../actions";

type Participante = {
  id: string;
  nombre: string;
  esPropio: boolean;
  atrasado: number;
  hastaHoy: number;
  cuotaMensual: number;
};

export function PagoCuotaForm({
  cuotaId,
  participantes,
  hoy,
}: {
  cuotaId: string;
  participantes: Participante[];
  hoy: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    registrarPagoCuota.bind(null, cuotaId),
    {},
  );
  const [participanteId, setParticipanteId] = useState(
    (participantes.find((p) => p.esPropio) ?? participantes[0])?.id ?? "",
  );
  const [monto, setMonto] = useState("");
  const seleccionado = participantes.find((p) => p.id === participanteId);

  // Atajos para no escribir el monto a mano.
  const sugerencias = seleccionado
    ? [
        { label: "Atrasado", valor: seleccionado.atrasado },
        { label: "Hasta este mes", valor: seleccionado.hastaHoy },
        { label: "Cuota mensual", valor: seleccionado.cuotaMensual },
      ].filter((s, i, arr) => s.valor > 0 && arr.findIndex((x) => x.valor === s.valor) === i)
    : [];

  return (
    <form action={action} className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-muted">¿Quién pagó?</legend>
        <div className="grid grid-cols-2 gap-2">
          {participantes.map((p) => (
            <label
              key={p.id}
              className={cx(
                "flex min-h-14 cursor-pointer flex-col justify-center rounded-xl border px-3.5 py-2 transition has-focus-visible:ring-2 has-focus-visible:ring-accent/40",
                participanteId === p.id ? "border-accent bg-accent-soft" : "border-border bg-surface",
              )}
            >
              <input
                type="radio"
                name="participanteId"
                value={p.id}
                checked={participanteId === p.id}
                onChange={() => setParticipanteId(p.id)}
                className="sr-only"
              />
              <span className={cx("truncate font-medium", participanteId === p.id && "text-accent")}>
                {p.nombre}
                {p.esPropio && " (tú)"}
              </span>
              <span className="text-xs text-muted">
                {p.atrasado > 0 ? `Atrasado ${formatSoles(p.atrasado)}` : "Al día"}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor="monto" className="text-sm font-medium text-muted">
          Monto
        </label>
        <MoneyInput
          id="monto"
          name="monto"
          size="lg"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          required
        />
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

      <Card className="flex flex-col gap-4">
        <Field label="Fecha" name="fecha" type="date" defaultValue={state.values?.fecha ?? hoy} max={hoy} required />
        <Field label="Nota (opcional)" name="nota" placeholder="Transferencia por Yape" defaultValue={state.values?.nota} maxLength={200} />
      </Card>

      {state.error && <Alert>{state.error}</Alert>}

      <Button type="submit" variant="primary" disabled={pending} className="min-h-12 w-full">
        {pending ? "Guardando…" : "Guardar pago"}
      </Button>
    </form>
  );
}

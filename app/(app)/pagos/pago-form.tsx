"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { CategoriaIcono } from "@/components/categoria-icono";
import { Alert, Button, Card, Field, MoneyInput, cx } from "@/components/ui";
import { VoucherInput, type VoucherValue } from "@/components/voucher-input";
import { formatSoles } from "@/lib/format";
import type { FormState } from "@/lib/validacion";

const METODOS = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "YAPE", label: "Yape" },
  { value: "PLIN", label: "Plin" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "TARJETA", label: "Tarjeta" },
  { value: "OTRO", label: "Otro" },
];

type Opciones = {
  categorias: { id: string; nombre: string; icono: string | null }[];
  metas: { id: string; nombre: string; falta: number }[];
  deudas: { id: string; nombre: string; falta: number }[];
};

export type PagoInicial = {
  monto: string;
  descripcion: string;
  fecha: string;
  metodo: string;
  categoriaId: string;
  vinculo: string;
  voucher: { url: string; tipo: string | null } | null;
};

export function PagoForm({
  action,
  opciones,
  inicial,
  modo,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  opciones: Opciones;
  inicial: PagoInicial;
  modo: "crear" | "editar";
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  const [categoriaId, setCategoriaId] = useState(inicial.categoriaId);
  const [metodo, setMetodo] = useState(inicial.metodo);
  const [vinculo, setVinculo] = useState(inicial.vinculo);
  const [voucher, setVoucher] = useState<VoucherValue>({ file: null, quitar: false });

  // Se envía con onSubmit (no con action) para que React no vacíe el formulario al volver
  // con un error: así se conservan lo escrito, la meta elegida y el voucher.
  const enviar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (voucher.file) formData.set("voucher", voucher.file);
    if (voucher.quitar) formData.set("quitarVoucher", "1");
    startTransition(() => formAction(formData));
  };

  return (
    <form onSubmit={enviar} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="monto" className="text-sm font-medium text-muted">
          Monto
        </label>
        <MoneyInput id="monto" name="monto" size="lg" defaultValue={inicial.monto} autoFocus={modo === "crear"} required />
      </div>

      <Field
        label="¿Qué pagaste?"
        name="descripcion"
        placeholder="Pensión de octubre"
        defaultValue={inicial.descripcion}
        maxLength={120}
        required
      />

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-muted">Categoría</legend>
        <input type="hidden" name="categoriaId" value={categoriaId} />
        <div className="flex flex-wrap gap-2">
          {opciones.categorias.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={categoriaId === c.id}
              onClick={() => setCategoriaId(categoriaId === c.id ? "" : c.id)}
              className={cx(
                "flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-sm transition active:scale-95",
                categoriaId === c.id ? "border-accent bg-accent-soft font-medium text-accent" : "border-border bg-surface",
              )}
            >
              <CategoriaIcono nombre={c.icono} className="size-4" />
              {c.nombre}
            </button>
          ))}
        </div>
      </fieldset>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted">Voucher (opcional)</h2>
        <VoucherInput existente={inicial.voucher} value={voucher} onChange={setVoucher} />
      </section>

      <Card className="flex flex-col gap-4">
        <Field label="Fecha" name="fecha" type="date" defaultValue={inicial.fecha} required />

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-muted">Método</legend>
          <input type="hidden" name="metodo" value={metodo} />
          <div className="flex flex-wrap gap-2">
            {METODOS.map((m) => (
              <button
                key={m.value}
                type="button"
                aria-pressed={metodo === m.value}
                onClick={() => setMetodo(m.value)}
                className={cx(
                  "min-h-10 rounded-full border px-3.5 text-sm transition active:scale-95",
                  metodo === m.value ? "border-accent bg-accent-soft font-medium text-accent" : "border-border bg-surface",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-muted">¿Cuenta para una meta o deuda?</span>
          <select
            name="vinculo"
            value={vinculo}
            onChange={(e) => setVinculo(e.target.value)}
            className="min-h-12 rounded-xl border border-border bg-surface px-3 outline-none focus:border-accent"
          >
            <option value="">No, es un gasto suelto</option>
            {opciones.metas.length > 0 && (
              <optgroup label="Suma a una meta">
                {opciones.metas.map((m) => (
                  <option key={m.id} value={`meta:${m.id}`}>
                    {m.nombre} (faltan {formatSoles(m.falta)})
                  </option>
                ))}
              </optgroup>
            )}
            {opciones.deudas.length > 0 && (
              <optgroup label="Abono a una deuda tuya">
                {opciones.deudas.map((d) => (
                  <option key={d.id} value={`deuda:${d.id}`}>
                    {d.nombre} (debes {formatSoles(d.falta)})
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </label>
      </Card>

      {state.error && <Alert>{state.error}</Alert>}

      <Button type="submit" variant="primary" disabled={pending} className="min-h-12 w-full">
        {pending ? (voucher.file ? "Subiendo voucher…" : "Guardando…") : modo === "crear" ? "Guardar pago" : "Guardar cambios"}
      </Button>
    </form>
  );
}

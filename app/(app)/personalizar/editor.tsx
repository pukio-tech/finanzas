"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff } from "lucide-react";
import { ConfirmButton } from "@/components/confirm-button";
import { Button, Card, cx } from "@/components/ui";
import { CANTIDADES_METAS, CANTIDADES_PAGOS, TARJETAS, type ConfigInicio, type Tarjeta } from "@/lib/inicio";
import { guardarConfigInicio, restablecerConfigInicio } from "./actions";

const anchas = Object.values(TARJETAS)
  .filter((t) => t.ancho === 2)
  .map((t) => t.nombre);
const ANCHAS = `${anchas.slice(0, -1).join(", ")} y ${anchas.at(-1)}`;

export function EditorInicio({ inicial }: { inicial: ConfigInicio }) {
  const [config, setConfig] = useState(inicial);
  const [pending, startTransition] = useTransition();

  const mover = (i: number, paso: -1 | 1) =>
    setConfig((c) => {
      const orden = [...c.orden];
      [orden[i], orden[i + paso]] = [orden[i + paso], orden[i]];
      return { ...c, orden };
    });

  const alternar = (t: Tarjeta) =>
    setConfig((c) => ({
      ...c,
      ocultas: c.ocultas.includes(t) ? c.ocultas.filter((x) => x !== t) : [...c.ocultas, t],
    }));

  const visibles = config.orden.filter((t) => !config.ocultas.includes(t)).length;

  return (
    <div className="flex flex-col gap-5">
      <Card flush className="divide-y divide-border">
        {config.orden.map((t, i) => {
          const visible = !config.ocultas.includes(t);
          const info = TARJETAS[t];
          return (
            <div key={t} className={cx("flex flex-col gap-3 p-4", !visible && "bg-surface-muted/50")}>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={visible}
                  aria-label={`${visible ? "Ocultar" : "Mostrar"} ${info.nombre}`}
                  onClick={() => alternar(t)}
                  className={cx(
                    "relative h-7 w-12 shrink-0 rounded-full border transition-[background-color,border-color]",
                    visible ? "border-accent bg-accent" : "border-border bg-surface-muted",
                  )}
                >
                  <span
                    className={cx(
                      "absolute top-0.5 left-0.5 size-5.5 rounded-full bg-surface shadow-sm transition-transform",
                      visible && "translate-x-5",
                    )}
                  />
                </button>
                <div className="min-w-0 flex-1">
                  <p className={cx("flex items-center gap-1.5 font-medium", !visible && "text-muted")}>
                    {info.nombre}
                    {visible ? (
                      <Eye className="size-4 text-muted" aria-hidden />
                    ) : (
                      <EyeOff className="size-4 text-muted" aria-hidden />
                    )}
                  </p>
                  <p className="text-sm text-muted">{info.descripcion}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => mover(i, -1)}
                    disabled={i === 0}
                    aria-label={`Subir ${info.nombre}`}
                    className="flex size-11 items-center justify-center rounded-[10px] text-muted hover:bg-surface-muted hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowUp className="size-4.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => mover(i, 1)}
                    disabled={i === config.orden.length - 1}
                    aria-label={`Bajar ${info.nombre}`}
                    className="flex size-11 items-center justify-center rounded-[10px] text-muted hover:bg-surface-muted hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowDown className="size-4.5" aria-hidden />
                  </button>
                </div>
              </div>

              {/* Cómo se ve cada tarjeta */}
              {visible && t === "sueldo" && (
                <label className="flex min-h-11 cursor-pointer items-center gap-3 pl-15 text-sm">
                  <input
                    type="checkbox"
                    checked={config.sueldoMeses}
                    onChange={(e) => setConfig((c) => ({ ...c, sueldoMeses: e.target.checked }))}
                    className="size-4.5 accent-[var(--accent)]"
                  />
                  Mostrar la fila de meses (cobrado, en parte, te deben)
                </label>
              )}
              {visible && t === "metas" && (
                <Opciones
                  etiqueta="Cuántas metas"
                  valores={CANTIDADES_METAS}
                  actual={config.metasCantidad}
                  texto={(n) => (n === 0 ? "Todas" : String(n))}
                  onChange={(n) => setConfig((c) => ({ ...c, metasCantidad: n }))}
                />
              )}
              {visible && t === "pagos" && (
                <Opciones
                  etiqueta="Cuántos pagos"
                  valores={CANTIDADES_PAGOS}
                  actual={config.pagosCantidad}
                  texto={String}
                  onChange={(n) => setConfig((c) => ({ ...c, pagosCantidad: n }))}
                />
              )}
            </div>
          );
        })}
      </Card>

      <p className="text-sm text-muted">
        {visibles === 0
          ? "No se mostrará ninguna tarjeta en el inicio"
          : `Se mostrarán ${visibles} ${visibles === 1 ? "tarjeta" : "tarjetas"} en este orden. En escritorio, ${ANCHAS} ocupan el doble de ancho`}
      </p>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <ConfirmButton
          action={restablecerConfigInicio}
          titulo="¿Volver a la configuración inicial?"
          message="El inicio vuelve a mostrar las tarjetas de siempre, en el orden de siempre."
          confirmar="Restablecer"
          tono="accent"
          className="min-h-11 rounded-[10px] px-4 text-sm text-muted hover:bg-surface-muted"
        >
          Restablecer
        </ConfirmButton>
        <Button
          type="button"
          variant="primary"
          disabled={pending}
          onClick={() => startTransition(() => guardarConfigInicio(JSON.stringify(config)))}
          className="min-h-12 sm:w-56"
        >
          {pending ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </div>
  );
}

function Opciones({
  etiqueta,
  valores,
  actual,
  texto,
  onChange,
}: {
  etiqueta: string;
  valores: number[];
  actual: number;
  texto: (n: number) => string;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 pl-15 text-sm">
      <span className="text-muted">{etiqueta}</span>
      <div className="flex rounded-[10px] border border-border p-0.5">
        {valores.map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={actual === n}
            onClick={() => onChange(n)}
            className={cx(
              "min-h-9 min-w-12 rounded-lg px-3 transition-[color,background-color]",
              actual === n ? "bg-accent-soft font-medium text-accent" : "text-muted hover:text-foreground",
            )}
          >
            {texto(n)}
          </button>
        ))}
      </div>
    </div>
  );
}

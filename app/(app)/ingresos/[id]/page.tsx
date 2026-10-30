import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { ConfirmButton } from "@/components/confirm-button";
import { PageHeader } from "@/components/page-header";
import { Card, cx } from "@/components/ui";
import { getIngreso } from "@/lib/data";
import { formatFecha, formatSoles, nombreMes } from "@/lib/format";
import { eliminarCobro, eliminarIngreso } from "../actions";
import { MesIngresoFila } from "./mes-ingreso";

export const metadata: Metadata = { title: "Ingreso" };

export default function IngresoPage({ params }: PageProps<"/ingresos/[id]">) {
  return (
    <Suspense fallback={<div className="mt-12 h-96 animate-pulse rounded-2xl bg-surface-muted" />}>
      <Detalle params={params} />
    </Suspense>
  );
}

async function Detalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ingreso = await getIngreso(id);
  const desde = ingreso.desde;

  return (
    <div className="flex flex-col gap-5 pb-6">
      <PageHeader
        title={ingreso.nombre}
        back={{ href: "/ingresos", label: "Ingresos" }}
        subtitle={`${formatSoles(ingreso.montoMensual)} al mes desde ${nombreMes(desde.getUTCMonth() + 1).toLowerCase()} ${desde.getUTCFullYear()}`}
        action={
          <Link
            href={`/ingresos/${ingreso.id}/editar`}
            aria-label="Editar ingreso"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-muted"
          >
            <Pencil className="size-5" aria-hidden />
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3">
        <Card className={cx("p-3.5", ingreso.porCobrarVencido > 0 ? "bg-warning-soft" : "bg-success-soft")}>
          <p className={cx("text-xs", ingreso.porCobrarVencido > 0 ? "text-warning" : "text-success")}>Te deben</p>
          <p className={cx("mt-1 text-lg font-semibold", ingreso.porCobrarVencido > 0 ? "text-warning" : "text-success")}>
            {ingreso.porCobrarVencido > 0 ? formatSoles(ingreso.porCobrarVencido) : "Al día"}
          </p>
        </Card>
        <Card className="p-3.5">
          <p className="text-xs text-muted">Falta este mes</p>
          <p className="mt-1 text-lg font-semibold">{formatSoles(ingreso.porCobrarMesActual)}</p>
        </Card>
      </div>
      {ingreso.saldoAFavor > 0 && (
        <p className="-mt-2 px-1 text-xs text-success">Cobraste {formatSoles(ingreso.saldoAFavor)} por adelantado.</p>
      )}

      <Link
        href={`/ingresos/${ingreso.id}/cobro`}
        className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent font-medium text-accent-foreground active:scale-[0.99]"
      >
        <Plus className="size-5" aria-hidden />
        Registrar cobro
      </Link>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Cobros</h2>
        <Card flush className="divide-y divide-border">
          {ingreso.cobros.length === 0 && <p className="p-4 text-sm text-muted">Aún no registras cobros.</p>}
          {ingreso.cobros.map((c) => (
            <div key={c.id} className="flex items-center gap-3 py-2.5 pr-2 pl-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{formatFecha(c.fecha)}</p>
                {c.nota && <p className="truncate text-xs text-muted">{c.nota}</p>}
              </div>
              <span className="shrink-0 font-medium">{formatSoles(c.monto)}</span>
              <ConfirmButton
                action={eliminarCobro.bind(null, ingreso.id, c.id)}
                titulo="¿Eliminar el cobro?"
                message={`Se quitan ${formatSoles(c.monto)} de tu dinero libre y vuelven a quedar por cobrar.`}
                label="Eliminar cobro"
                className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-surface-muted hover:text-danger"
              >
                <Trash2 className="size-[18px]" aria-hidden />
              </ConfirmButton>
            </div>
          ))}
          {ingreso.cobros.length > 0 && (
            <div className="flex justify-between px-4 py-2.5 text-sm">
              <span className="text-muted">Total cobrado</span>
              <span className="font-semibold">{formatSoles(ingreso.totalRecibido)}</span>
            </div>
          )}
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Mes a mes</h2>
        <p className="-mt-2 text-xs text-muted">Cada cobro se descuenta del mes más antiguo que falta.</p>
        <div className="flex flex-col gap-2">
          {[...ingreso.meses].reverse().map((m) => (
            <MesIngresoFila key={`${m.anio}-${m.mes}`} ingresoId={ingreso.id} mes={m} />
          ))}
        </div>
      </section>

      <ConfirmButton
        action={eliminarIngreso.bind(null, ingreso.id)}
        titulo="¿Eliminar el ingreso?"
        message={`Se borra "${ingreso.nombre}" con todos sus cobros. Tu dinero libre no cambia. No se puede deshacer.`}
        className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-medium text-danger"
      >
        <Trash2 className="size-4" aria-hidden />
        Eliminar ingreso
      </ConfirmButton>
    </div>
  );
}

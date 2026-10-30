import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { ConfirmButton } from "@/components/confirm-button";
import { PageHeader } from "@/components/page-header";
import { Card, cx } from "@/components/ui";
import { getCuota, type CuotaDetalle } from "@/lib/data";
import { formatFecha, formatSoles, nombreMes } from "@/lib/format";
import { eliminarCuota, eliminarPagoCuota } from "../actions";
import { AgregarMesesForm, MesEditable } from "./meses";

export const metadata: Metadata = { title: "Cuota" };

export default function CuotaPage({ params }: PageProps<"/cuotas/[id]">) {
  return (
    <Suspense fallback={<DetalleSkeleton />}>
      <Detalle params={params} />
    </Suspense>
  );
}

async function Detalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cuota = await getCuota(id);
  const nombre = new Map(cuota.participantes.map((p) => [p.id, p.nombre]));
  const actual = cuota.periodos.find((p) => p.actual);
  const ultimo = cuota.periodos.at(-1);

  return (
    <div className="flex flex-col gap-5 pb-6">
      <PageHeader
        title={cuota.concepto}
        back={{ href: "/cuotas", label: "Cuotas" }}
        subtitle={
          actual
            ? `${nombreMes(actual.mes)} ${actual.anio}: ${formatSoles(actual.monto)} en total`
            : "Sin monto para este mes"
        }
        action={
          <Link
            href={`/cuotas/${cuota.id}/editar`}
            aria-label="Editar cuota"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-muted"
          >
            <Pencil className="size-5" aria-hidden />
          </Link>
        }
      />

      <Resumen cuota={cuota} />

      <Link
        href={`/cuotas/${cuota.id}/pago`}
        className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent font-medium text-accent-foreground active:scale-[0.99]"
      >
        <Plus className="size-5" aria-hidden />
        Registrar pago
      </Link>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Meses</h2>
        {cuota.periodos.length === 0 && <p className="text-sm text-muted">Esta cuota aún no tiene meses.</p>}
        <div className="flex flex-col gap-2">
          {cuota.periodos.map((periodo) => (
            <MesEditable
              key={periodo.id}
              cuotaId={cuota.id}
              periodo={periodo}
              participantes={cuota.participantes.map((p) => ({ id: p.id, nombre: p.nombre }))}
            />
          ))}
        </div>
        <AgregarMesesForm cuotaId={cuota.id} montoSugerido={ultimo?.monto ?? 0} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Pagos</h2>
        <Card flush className="divide-y divide-border">
          {cuota.pagos.length === 0 && <p className="p-4 text-sm text-muted">Aún no hay pagos registrados.</p>}
          {cuota.pagos.map((pago) => (
            <div key={pago.id} className="flex items-center gap-3 py-2.5 pr-2 pl-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{nombre.get(pago.participanteId)}</p>
                <p className="truncate text-xs text-muted">
                  {formatFecha(pago.fecha)}
                  {pago.nota && ` · ${pago.nota}`}
                </p>
              </div>
              <span className="shrink-0 font-medium">{formatSoles(pago.monto)}</span>
              <ConfirmButton
                action={eliminarPagoCuota.bind(null, cuota.id, pago.id)}
                message={`¿Eliminar el pago de ${formatSoles(pago.monto)} de ${nombre.get(pago.participanteId)}?`}
                label="Eliminar pago"
                className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-surface-muted hover:text-danger"
              >
                <Trash2 className="size-[18px]" aria-hidden />
              </ConfirmButton>
            </div>
          ))}
        </Card>
      </section>

      <ConfirmButton
        action={eliminarCuota.bind(null, cuota.id)}
        message={`¿Eliminar "${cuota.concepto}" con todos sus meses y pagos? No se puede deshacer.`}
        className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-medium text-danger"
      >
        <Trash2 className="size-4" aria-hidden />
        Eliminar cuota
      </ConfirmButton>
    </div>
  );
}

function Resumen({ cuota }: { cuota: CuotaDetalle }) {
  return (
    <Card flush className="divide-y divide-border">
      {cuota.participantes.map((p) => {
        const r = cuota.porParticipante.find((x) => x.participanteId === p.id)!;
        return (
          <div key={p.id} className="flex flex-col gap-2 p-4">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate font-semibold">
                {p.nombre}
                {p.esPropio && <span className="ml-1.5 text-xs font-normal text-muted">(tú)</span>}
              </p>
              <span className="shrink-0 text-xs text-muted">{p.porcentaje}% · pagó {formatSoles(r.totalPagado)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className={cx("rounded-xl px-3 py-2", r.faltanteVencido > 0 ? "bg-warning-soft" : "bg-success-soft")}>
                <p className={cx("text-xs", r.faltanteVencido > 0 ? "text-warning" : "text-success")}>Atrasado</p>
                <p className={cx("font-semibold", r.faltanteVencido > 0 ? "text-warning" : "text-success")}>
                  {r.faltanteVencido > 0 ? formatSoles(r.faltanteVencido) : "Al día"}
                </p>
              </div>
              <div className="rounded-xl bg-surface-muted px-3 py-2">
                <p className="text-xs text-muted">Falta este mes</p>
                <p className="font-semibold">{formatSoles(r.faltanteMesActual)}</p>
              </div>
            </div>
            {r.saldoAFavor > 0 && (
              <p className="text-xs text-success">Saldo a favor: {formatSoles(r.saldoAFavor)} (cubrirá los próximos meses)</p>
            )}
          </div>
        );
      })}
    </Card>
  );
}

function DetalleSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4 pt-12" aria-busy="true" aria-label="Cargando cuota">
      <div className="h-8 w-2/3 rounded bg-surface-muted" />
      <div className="h-44 rounded-2xl bg-surface-muted" />
      <div className="h-12 rounded-xl bg-surface-muted" />
      <div className="h-64 rounded-2xl bg-surface-muted" />
    </div>
  );
}

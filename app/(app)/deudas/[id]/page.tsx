import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Pencil, Receipt, Trash2 } from "lucide-react";
import { ConfirmButton } from "@/components/confirm-button";
import { MovimientoForm } from "@/components/movimiento-form";
import { PageHeader } from "@/components/page-header";
import { Card, ProgressBar, cx } from "@/components/ui";
import { getDeuda } from "@/lib/data";
import { hoyISO, isoDesdeFecha } from "@/lib/fechas";
import { formatFecha, formatSoles } from "@/lib/format";
import { agregarAbono, eliminarAbono, eliminarDeuda } from "../actions";

export const metadata: Metadata = { title: "Deuda" };

export default function DeudaPage({ params }: PageProps<"/deudas/[id]">) {
  return (
    <Suspense fallback={<div className="mt-12 h-96 animate-pulse rounded-2xl bg-surface-muted" />}>
      <Detalle params={params} />
    </Suspense>
  );
}

async function Detalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deuda = await getDeuda(id);
  const debo = deuda.tipo === "DEBO";
  const hoy = hoyISO();
  const vencida = deuda.pendiente > 0 && deuda.fechaLimite && isoDesdeFecha(deuda.fechaLimite) < hoy;

  return (
    <div className="flex flex-col gap-5 pb-6">
      <PageHeader
        title={deuda.contraparte}
        back={{ href: "/deudas", label: "Deudas" }}
        subtitle={debo ? "Le debes" : "Te debe"}
        action={
          <Link
            href={`/deudas/${deuda.id}/editar`}
            aria-label="Editar deuda"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-muted"
          >
            <Pencil className="size-5" aria-hidden />
          </Link>
        }
      />

      <Card className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-muted">{deuda.pendiente > 0 ? "Pendiente" : "Saldada"}</p>
          <p className={cx("text-[34px] leading-tight font-semibold tracking-tight", deuda.pendiente === 0 && "text-success")}>
            {formatSoles(deuda.pendiente)}
          </p>
        </div>
        <ProgressBar value={deuda.monto > 0 ? (deuda.abonado / deuda.monto) * 100 : 0} />
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted">Monto total</dt>
          <dd>{formatSoles(deuda.monto)}</dd>
          <dt className="text-muted">{debo ? "Pagado" : "Te devolvió"}</dt>
          <dd>{formatSoles(deuda.abonado)}</dd>
          <dt className="text-muted">Desde</dt>
          <dd>{formatFecha(deuda.fecha)}</dd>
          {deuda.fechaLimite && (
            <>
              <dt className="text-muted">Pagar hasta</dt>
              <dd className={cx(vencida && "font-medium text-danger")}>
                {formatFecha(deuda.fechaLimite)}
                {vencida && " (vencida)"}
              </dd>
            </>
          )}
          {deuda.descripcion && (
            <>
              <dt className="text-muted">Detalle</dt>
              <dd>{deuda.descripcion}</dd>
            </>
          )}
        </dl>
      </Card>

      {deuda.pendiente > 0 && (
        <MovimientoForm
          action={agregarAbono.bind(null, deuda.id)}
          titulo={debo ? "Registrar lo que pagaste" : "Registrar lo que te devolvió"}
          boton="Agregar abono"
          hoy={hoy}
          montoSugerido={deuda.pendiente}
        />
      )}
      {debo && deuda.pendiente > 0 && (
        <p className="-mt-2 px-1 text-xs text-muted">
          ¿Quieres guardar el voucher? Regístralo como{" "}
          <Link href="/pagos/nuevo" className="text-accent">
            pago realizado
          </Link>{" "}
          y vincúlalo a esta deuda.
        </p>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Abonos</h2>
        <Card flush className="divide-y divide-border">
          {deuda.abonos.length === 0 && <p className="p-4 text-sm text-muted">Aún no hay abonos.</p>}
          {deuda.abonos.map((a) => (
            <div key={a.id} className="flex items-center gap-3 py-2.5 pr-2 pl-4">
              <div className="min-w-0 flex-1">
                {a.pago ? (
                  <Link href={`/pagos/${a.pago.id}`} className="flex items-center gap-1.5 truncate font-medium text-accent">
                    <Receipt className="size-4 shrink-0" aria-hidden />
                    {a.pago.descripcion}
                  </Link>
                ) : (
                  <p className="truncate font-medium">{a.nota ?? "Abono"}</p>
                )}
                <p className="text-xs text-muted">{formatFecha(a.fecha)}</p>
              </div>
              <span className="shrink-0 font-medium">{formatSoles(a.monto)}</span>
              {a.pago ? (
                <span className="size-11 shrink-0" />
              ) : (
                <ConfirmButton
                  action={eliminarAbono.bind(null, deuda.id, a.id)}
                  message={`¿Eliminar el abono de ${formatSoles(a.monto)}?`}
                  label="Eliminar abono"
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-surface-muted hover:text-danger"
                >
                  <Trash2 className="size-[18px]" aria-hidden />
                </ConfirmButton>
              )}
            </div>
          ))}
        </Card>
      </section>

      <ConfirmButton
        action={eliminarDeuda.bind(null, deuda.id)}
        message={`¿Eliminar la deuda con ${deuda.contraparte} y sus abonos? Los pagos vinculados se conservan.`}
        className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-medium text-danger"
      >
        <Trash2 className="size-4" aria-hidden />
        Eliminar deuda
      </ConfirmButton>
    </div>
  );
}

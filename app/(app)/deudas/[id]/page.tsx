import { Soles } from "@/components/soles";
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
import { agregarAbono, agregarAumento, eliminarAbono, eliminarAumento, eliminarDeuda } from "../actions";

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
  const aumentado = Math.round((deuda.monto - deuda.montoInicial) * 100) / 100;

  // Abonos (bajan la deuda) y aumentos (la suben) en un solo historial, del más reciente al más antiguo.
  const movimientos = [
    ...deuda.abonos.map((a) => ({ ...a, clase: "abono" as const })),
    ...deuda.aumentos.map((a) => ({ ...a, pago: null, clase: "aumento" as const })),
  ].sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

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
            className="flex size-11 shrink-0 items-center justify-center rounded-[10px] border border-border bg-surface text-muted"
          >
            <Pencil className="size-4.5" aria-hidden />
          </Link>
        }
      />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2 lg:gap-6">
        <div className="flex flex-col gap-5">
          <Card className="flex flex-col gap-4">
            <div>
              <p className="text-sm text-muted">{deuda.pendiente > 0 ? "Pendiente" : "Saldada"}</p>
              <p className={cx("text-[32px] leading-tight font-medium tracking-tight", deuda.pendiente === 0 && "text-success")}>
                <Soles value={deuda.pendiente} />
              </p>
            </div>
            <ProgressBar value={deuda.monto > 0 ? (deuda.abonado / deuda.monto) * 100 : 0} />
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              {aumentado > 0 && (
                <>
                  <dt className="text-muted">Monto inicial</dt>
                  <dd><Soles value={deuda.montoInicial} /></dd>
                  <dt className="text-muted">Se sumó</dt>
                  <dd>+ {formatSoles(aumentado)}</dd>
                </>
              )}
              <dt className="text-muted">Monto total</dt>
              <dd><Soles value={deuda.monto} /></dd>
              <dt className="text-muted">{debo ? "Pagado" : "Te devolvió"}</dt>
              <dd><Soles value={deuda.abonado} /></dd>
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
              ayuda={debo ? "Se descuenta de tu dinero libre." : "Se suma a tu dinero libre."}
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

          <MovimientoForm
            action={agregarAumento.bind(null, deuda.id)}
            titulo={debo ? "Debo más" : "Me debe más"}
            boton="Sumar a la deuda"
            ayuda={debo ? "Aumenta lo que debes." : "Aumenta lo que te debe."}
            notaEjemplo={debo ? "Compra fiada" : "Planchado"}
            hoy={hoy}
          >
            <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
              <input type="checkbox" name="movioLibre" className="mt-0.5 size-4.5 shrink-0 accent-[var(--accent)]" />
              <span>
                {debo ? "Me prestaron esa plata" : "Le presté esa plata"}
                <span className="block text-xs text-muted">
                  {debo
                    ? "Márcalo si te dieron dinero: entra a tu dinero libre. Si solo debes más (algo fiado), déjalo sin marcar."
                    : "Márcalo si le diste dinero: sale de tu dinero libre. Si solo te debe más (un servicio), déjalo sin marcar."}
                </span>
              </span>
            </label>
          </MovimientoForm>
        </div>
        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-3">
            <h2 className="text-base font-medium">Movimientos</h2>
            <Card flush className="divide-y divide-border">
              {movimientos.length === 0 && <p className="p-4 text-sm text-muted">Aún no hay abonos ni aumentos</p>}
              {movimientos.map((m) => (
                <div key={m.id} className="flex items-center gap-3 py-2.5 pr-2 pl-4">
                  <div className="min-w-0 flex-1">
                    {m.pago ? (
                      <Link href={`/pagos/${m.pago.id}`} className="flex items-center gap-1.5 truncate font-medium text-accent">
                        <Receipt className="size-4 shrink-0" aria-hidden />
                        {m.pago.descripcion}
                      </Link>
                    ) : (
                      <p className="truncate font-medium">{m.nota ?? (m.clase === "abono" ? "Abono" : "Se sumó a la deuda")}</p>
                    )}
                    <p className="text-xs text-muted">
                      {formatFecha(m.fecha)} ·{" "}
                      {m.clase === "abono" ? "abono" : m.movioLibre ? (debo ? "te prestaron" : "le prestaste") : "aumento"}
                    </p>
                  </div>
                  <span className={cx("shrink-0 font-medium", m.clase === "abono" ? "text-success" : "text-warning")}>
                    {m.clase === "abono" ? "−" : "+"} {formatSoles(m.monto)}
                  </span>
                  {m.pago ? (
                    <span className="size-11 shrink-0" />
                  ) : (
                    <ConfirmButton
                      action={
                        m.clase === "abono"
                          ? eliminarAbono.bind(null, deuda.id, m.id)
                          : eliminarAumento.bind(null, deuda.id, m.id)
                      }
                      titulo={m.clase === "abono" ? "¿Eliminar el abono?" : "¿Quitar el aumento?"}
                      message={
                        m.clase === "abono"
                          ? `${formatSoles(m.monto)} ${debo ? "vuelven a" : "salen de"} tu dinero libre.`
                          : m.movioLibre
                            ? `La deuda baja ${formatSoles(m.monto)} y ese monto ${debo ? "sale de" : "vuelve a"} tu dinero libre.`
                            : `La deuda baja ${formatSoles(m.monto)}. Tu dinero libre no cambia.`
                      }
                      label={m.clase === "abono" ? "Eliminar abono" : "Quitar aumento"}
                      className="flex size-11 shrink-0 items-center justify-center rounded-[10px] text-muted hover:bg-surface-muted hover:text-danger"
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
            titulo="¿Eliminar la deuda?"
            message={`Se borra la deuda con ${deuda.contraparte} con sus abonos y aumentos. Tu dinero libre no cambia y los pagos vinculados se conservan.`}
            className="flex min-h-12 items-center justify-center gap-2 rounded-[10px] border border-border bg-surface text-sm font-medium text-danger"
          >
            <Trash2 className="size-4" aria-hidden />
            Eliminar deuda
          </ConfirmButton>
        </div>
      </div>
    </div>
  );
}

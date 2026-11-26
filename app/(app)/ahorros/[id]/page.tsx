import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { ConfirmButton } from "@/components/confirm-button";
import { BancoLogo } from "@/components/banco-logo";
import { MovimientoForm } from "@/components/movimiento-form";
import { PageHeader } from "@/components/page-header";
import { Soles } from "@/components/soles";
import { Card, cx } from "@/components/ui";
import { BANCOS, esBanco } from "@/lib/bancos";
import { getCuenta } from "@/lib/data";
import { hoyISO } from "@/lib/fechas";
import { formatFecha, formatSoles } from "@/lib/format";
import { agregarEntrada, agregarSalida, eliminarCuenta, eliminarMovimiento } from "../actions";

export const metadata: Metadata = { title: "Ahorro" };

export default function CuentaPage({ params }: PageProps<"/ahorros/[id]">) {
  return (
    <Suspense fallback={<div className="mt-12 h-96 animate-pulse rounded-2xl bg-surface-muted" />}>
      <Detalle params={params} />
    </Suspense>
  );
}

async function Detalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cuenta = await getCuenta(id);
  const hoy = hoyISO();
  const entradas = cuenta.movimientos.filter((m) => m.tipo === "ENTRADA");
  const totalEntro = entradas.reduce((t, m) => t + Math.round(m.monto * 100), 0) / 100;
  const totalSalio = Math.round((totalEntro - cuenta.saldo) * 100) / 100;

  return (
    <div className="flex flex-col gap-5 pb-6">
      <PageHeader
        title={cuenta.nombre}
        back={{ href: "/ahorros", label: "Ahorros" }}
        subtitle="Va aparte: no se suma a tu sueldo ni a tu dinero libre"
        action={
          <Link
            href={`/ahorros/${cuenta.id}/editar`}
            aria-label="Editar cuenta"
            className="flex size-11 shrink-0 items-center justify-center rounded-[10px] border border-border bg-surface text-muted"
          >
            <Pencil className="size-4.5" aria-hidden />
          </Link>
        }
      />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2 lg:gap-6">
        <div className="flex flex-col gap-5">
          <Card className="flex flex-col gap-3">
            <Link href={`/ahorros/${cuenta.id}/editar`} className="flex w-fit items-center gap-2.5">
              <BancoLogo banco={cuenta.banco} className="size-8" />
              <span className={cx("text-sm", esBanco(cuenta.banco) ? "font-medium" : "text-accent")}>
                {esBanco(cuenta.banco) ? BANCOS[cuenta.banco].nombre : "Indicar en qué banco está"}
              </span>
            </Link>
            <div>
              <p className="text-sm text-muted">Tienes</p>
              <p className="text-[32px] leading-tight font-medium tracking-tight">
                <Soles value={cuenta.saldo} />
              </p>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted">Este mes entró</dt>
              <dd className={cx(cuenta.entroEsteMes > 0 && "text-success")}>
                <Soles value={cuenta.entroEsteMes} />
              </dd>
              <dt className="text-muted">En total entró</dt>
              <dd>
                <Soles value={totalEntro} />
              </dd>
              {totalSalio > 0 && (
                <>
                  <dt className="text-muted">Sacaste</dt>
                  <dd>
                    <Soles value={totalSalio} />
                  </dd>
                </>
              )}
            </dl>
          </Card>

          <MovimientoForm
            action={agregarEntrada.bind(null, cuenta.id)}
            titulo="Me llegó plata"
            boton="Agregar"
            ayuda="El monto que sea, cuando te llegue."
            notaEjemplo="Pago de la semana"
            hoy={hoy}
          />

          {cuenta.saldo > 0 && (
            <MovimientoForm
              action={agregarSalida.bind(null, cuenta.id)}
              titulo="Saqué plata"
              boton="Registrar salida"
              hoy={hoy}
              montoSugerido={cuenta.saldo}
              notaEjemplo="Para la universidad"
            >
              <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
                <input type="checkbox" name="aLibre" defaultChecked className="mt-0.5 size-4.5 shrink-0 accent-[var(--accent)]" />
                <span>
                  Pasarla a mi dinero libre
                  <span className="block text-xs text-muted">Desmárcalo si la gastaste directo desde esta cuenta.</span>
                </span>
              </label>
            </MovimientoForm>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-3">
            <h2 className="text-base font-medium">Movimientos</h2>
            <Card flush className="divide-y divide-border">
              {cuenta.movimientos.length === 0 && <p className="p-4 text-sm text-muted">Aún no hay movimientos</p>}
              {cuenta.movimientos.map((m) => {
                const entrada = m.tipo === "ENTRADA";
                return (
                  <div key={m.id} className="flex items-center gap-3 py-2.5 pr-2 pl-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{m.nota ?? (entrada ? "Entrada" : "Salida")}</p>
                      <p className="text-xs text-muted">
                        {formatFecha(m.fecha)}
                        {!entrada && (m.aLibre ? " · a tu dinero libre" : " · salida")}
                      </p>
                    </div>
                    <span className={cx("shrink-0 font-medium", entrada && "text-success")}>
                      {entrada ? "+" : "−"} {formatSoles(m.monto)}
                    </span>
                    <ConfirmButton
                      action={eliminarMovimiento.bind(null, cuenta.id, m.id)}
                      titulo={entrada ? "¿Eliminar la entrada?" : "¿Eliminar la salida?"}
                      message={
                        entrada
                          ? `El saldo de ${cuenta.nombre} baja ${formatSoles(m.monto)}.`
                          : m.aLibre
                            ? `${formatSoles(m.monto)} vuelven a ${cuenta.nombre} y salen de tu dinero libre.`
                            : `${formatSoles(m.monto)} vuelven a ${cuenta.nombre}.`
                      }
                      label={entrada ? "Eliminar entrada" : "Eliminar salida"}
                      className="flex size-11 shrink-0 items-center justify-center rounded-[10px] text-muted hover:bg-surface-muted hover:text-danger"
                    >
                      <Trash2 className="size-4.5" aria-hidden />
                    </ConfirmButton>
                  </div>
                );
              })}
            </Card>
          </section>

          <ConfirmButton
            action={eliminarCuenta.bind(null, cuenta.id)}
            titulo="¿Eliminar la cuenta?"
            message={`Se borra ${cuenta.nombre} con todos sus movimientos. Lo que ya pasaste a tu dinero libre se queda ahí.`}
            className="flex min-h-12 items-center justify-center gap-2 rounded-[10px] border border-border bg-surface text-sm font-medium text-danger"
          >
            <Trash2 className="size-4" aria-hidden />
            Eliminar cuenta
          </ConfirmButton>
        </div>
      </div>
    </div>
  );
}

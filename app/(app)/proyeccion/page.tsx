import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { CircleCheck, TriangleAlert } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, cx } from "@/components/ui";
import { getProyeccion } from "@/lib/data";
import { sumarMeses, type MesAnio } from "@/lib/fechas";
import { formatSoles, nombreMes } from "@/lib/format";
import { PlanForm } from "./plan-form";

export const metadata: Metadata = { title: "Proyección" };

export default function ProyeccionPage({ searchParams }: PageProps<"/proyeccion">) {
  return (
    <div className="flex flex-col gap-5 pb-6">
      <PageHeader title="Proyección" subtitle="Cuánto tendrás ahorrado y si te alcanza para tus metas." />
      <Suspense fallback={<div className="h-[32rem] animate-pulse rounded-2xl bg-surface-muted" />}>
        <Contenido searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

const mesCorto = (m: MesAnio) => `${nombreMes(m.mes).slice(0, 3)} ${String(m.anio).slice(2)}`;
const clave = (m: MesAnio) => `${m.anio}-${String(m.mes).padStart(2, "0")}`;

function leerMes(valor: unknown): MesAnio | undefined {
  const match = typeof valor === "string" && /^(\d{4})-(0[1-9]|1[0-2])$/.exec(valor);
  return match ? { anio: Number(match[1]), mes: Number(match[2]) } : undefined;
}

async function Contenido({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const p = await getProyeccion(leerMes(sp.hasta));
  const alcanza = p.restante >= 0;
  const maximo = Math.max(...p.meses.map((m) => m.acumulado), p.totalMetas, 1);
  const opcionesHasta = [3, 6, 12].map((n) => sumarMeses(p.desde, n - 1));

  return (
    <>
      <Card className={cx("flex flex-col gap-1 border-2", alcanza ? "border-success/40" : "border-danger/40")}>
        <p className="flex items-center gap-1.5 text-sm font-medium">
          {alcanza ? (
            <CircleCheck className="size-4 text-success" aria-hidden />
          ) : (
            <TriangleAlert className="size-4 text-danger" aria-hidden />
          )}
          {alcanza ? "Te alcanza para tus metas" : "No te alcanza todavía"}
        </p>
        <p className={cx("text-[34px] leading-tight font-semibold tracking-tight", alcanza ? "text-success" : "text-danger")}>
          {formatSoles(Math.abs(p.restante))}
        </p>
        <p className="text-sm text-muted">
          {alcanza ? "te sobrarían" : "te faltarían"} a {nombreMes(p.hasta.mes).toLowerCase()} de {p.hasta.anio}
        </p>
      </Card>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted">Proyectar hasta</h2>
        <div className="flex flex-wrap gap-2">
          {[p.porDefecto, ...opcionesHasta]
            .filter((m, i, arr) => arr.findIndex((x) => clave(x) === clave(m)) === i)
            .sort((a, b) => clave(a).localeCompare(clave(b)))
            .map((m) => (
              <Link
                key={clave(m)}
                href={`/proyeccion?hasta=${clave(m)}`}
                className={cx(
                  "flex min-h-10 items-center rounded-full border px-3.5 text-sm",
                  clave(m) === clave(p.hasta) ? "border-accent bg-accent-soft font-medium text-accent" : "border-border bg-surface",
                )}
              >
                {nombreMes(m.mes)} {m.anio}
              </Link>
            ))}
        </div>
        <form action="/proyeccion" className="flex gap-2">
          <input
            type="month"
            name="hasta"
            defaultValue={clave(p.hasta)}
            min={clave(p.desde)}
            aria-label="Otro mes"
            className="min-h-11 min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 outline-none focus:border-accent"
          />
          <button type="submit" className="min-h-11 rounded-xl border border-border bg-surface px-4 text-sm font-medium">
            Ver
          </button>
        </form>
      </section>

      {/* Desglose al estilo de la hoja de Excel */}
      <Card flush className="divide-y divide-border text-sm">
        <Fila label="Dinero libre" detalle="Sin contar lo que ya separaste para metas" detalleTono="muted" valor={p.ahorroActual} />
        {p.porCobrarVencido > 0 && (
          <Fila label="Te deben de tu sueldo" detalle="Meses pasados sin cobrar" detalleTono="muted" valor={p.porCobrarVencido} signo="+" href="/ingresos" />
        )}
        {p.tieneIngresos ? (
          <Fila
            label={`Ingresos de ${p.meses.length} ${p.meses.length === 1 ? "mes" : "meses"}`}
            detalle={`${nombreMes(p.desde.mes)} a ${nombreMes(p.hasta.mes).toLowerCase()}, lo que falta cobrar`}
            detalleTono="muted"
            valor={p.ingresosFuturos}
            signo="+"
            href="/ingresos"
          />
        ) : (
          <Link href="/ingresos/nuevo" className="flex min-h-12 items-center px-4 py-2 text-accent">
            Agrega tu sueldo para proyectar tus ingresos
          </Link>
        )}
        {p.gastoMensual > 0 && (
          <Fila
            label="Gastos fijos"
            detalle={`${formatSoles(p.gastoMensual)} × ${p.meses.length}`}
            detalleTono="muted"
            valor={p.gastos}
            signo="−"
          />
        )}
        {p.meDeben > 0 && <Fila label="Te deben (deudas)" valor={p.meDeben} signo="+" href="/deudas" />}
        {p.debo > 0 && <Fila label="Debes" valor={p.debo} signo="−" href="/deudas" />}
        <Fila label="Total" valor={p.total} destacado />
        {p.metas.map((m) => (
          <Fila
            key={m.id}
            label={`${m.nombre} (lo que falta)`}
            detalle={`${m.separado ? `Ya tienes ${formatSoles(m.separado)} · ` : ""}${m.cubiertaEn ? `cubierta en ${nombreMes(m.cubiertaEn.mes).toLowerCase()} ${m.cubiertaEn.anio}` : "no se cubre en este plazo"}`}
            detalleTono={m.cubiertaEn ? "success" : "danger"}
            valor={m.falta}
            signo="−"
            href={`/metas/${m.id}`}
          />
        ))}
        {p.metas.length === 0 && (
          <p className="px-4 py-3 text-muted">
            No tienes metas pendientes.{" "}
            <Link href="/metas/nueva" className="text-accent">
              Crear una
            </Link>
          </p>
        )}
        <Fila label={alcanza ? "Restante" : "Faltante"} valor={Math.abs(p.restante)} destacado tono={alcanza ? "success" : "danger"} />
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Mes a mes</h2>
        <Card className="flex flex-col gap-3">
          {p.meses.map((m) => (
            <div key={clave(m)} className="grid grid-cols-[3.25rem_1fr] items-center gap-x-3 gap-y-0.5">
              <span className="text-xs text-muted capitalize">{mesCorto(m)}</span>
              <div className="flex items-center gap-2">
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className={cx("h-full rounded-full", m.acumulado >= p.totalMetas ? "bg-success" : "bg-accent")}
                    style={{ width: `${Math.max(0, (m.acumulado / maximo) * 100)}%` }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right text-sm font-medium tabular-nums">{formatSoles(m.acumulado)}</span>
              </div>
              {m.metasCubiertas.length > 0 && (
                <p className="col-start-2 flex items-center gap-1 text-xs text-success">
                  <CircleCheck className="size-3.5" aria-hidden />
                  Cubres {m.metasCubiertas.join(" y ")}
                </p>
              )}
            </div>
          ))}
          {p.totalMetas > 0 && (
            <p className="border-t border-border pt-2 text-xs text-muted">
              Necesitas {formatSoles(p.totalMetas)} para todas tus metas. La barra se pone verde cuando lo alcanzas.
            </p>
          )}
        </Card>
      </section>

      <PlanForm ahorroActual={p.ahorroActual} gastoMensual={p.gastoMensual} />
    </>
  );
}

function Fila({
  label,
  valor,
  signo,
  destacado,
  tono,
  detalle,
  detalleTono,
  href,
}: {
  label: string;
  valor: number;
  signo?: "+" | "−";
  destacado?: boolean;
  tono?: "success" | "danger";
  detalle?: string;
  detalleTono?: "success" | "danger" | "muted";
  href?: string;
}) {
  const contenido = (
    <>
      <div className="min-w-0 flex-1">
        <p className={cx("truncate", destacado && "font-semibold")}>{label}</p>
        {detalle && (
          <p className={cx("text-xs", detalleTono === "danger" ? "text-danger" : detalleTono === "muted" ? "text-muted" : "text-success")}>
            {detalle}
          </p>
        )}
      </div>
      <span
        className={cx(
          "shrink-0 tabular-nums",
          destacado && "font-semibold",
          tono === "success" && "text-success",
          tono === "danger" && "text-danger",
          signo === "−" && !tono && "text-muted",
        )}
      >
        {signo && `${signo} `}
        {formatSoles(valor)}
      </span>
    </>
  );
  const clase = cx("flex min-h-12 items-center gap-3 px-4 py-2", destacado && "bg-surface-muted/60");
  return href ? (
    <Link href={href} className={cx(clase, "active:bg-surface-muted")}>
      {contenido}
    </Link>
  ) : (
    <div className={clase}>{contenido}</div>
  );
}

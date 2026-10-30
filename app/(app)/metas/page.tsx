import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { CircleCheck, Plus, Target } from "lucide-react";
import { CategoriaIcono } from "@/components/categoria-icono";
import { PageHeader } from "@/components/page-header";
import { Card, ProgressBar, cx } from "@/components/ui";
import { getMetas } from "@/lib/data";
import { mesesHasta } from "@/lib/fechas";
import { formatFecha, formatSoles } from "@/lib/format";

export const metadata: Metadata = { title: "Metas" };

const PRIORIDAD = ["", "Alta", "Media", "Baja"];

export default function MetasPage() {
  return (
    <div className="flex flex-col gap-4 pb-6">
      <PageHeader
        title="Metas"
        subtitle="Lo que quieres comprar o pagar, y cuánto te falta."
        action={
          <Link
            href="/metas/nueva"
            className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-accent px-3.5 text-sm font-medium text-accent-foreground"
          >
            <Plus className="size-4" aria-hidden />
            Nueva
          </Link>
        }
      />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-surface-muted" />}>
        <Lista />
      </Suspense>
    </div>
  );
}

async function Lista() {
  const metas = await getMetas();
  const activas = metas.filter((m) => m.estado === "ACTIVA");
  const cerradas = metas.filter((m) => m.estado !== "ACTIVA");
  const totalFalta = Math.round(activas.reduce((s, m) => s + m.falta, 0) * 100) / 100;

  if (metas.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <Target className="size-6" aria-hidden />
        </span>
        <div>
          <p className="font-medium">Crea tu primera meta</p>
          <p className="mt-1 text-sm text-muted">Por ejemplo, una laptop o la matrícula de la universidad.</p>
        </div>
        <Link href="/metas/nueva" className="mt-1 flex min-h-11 items-center rounded-xl bg-accent px-4 font-medium text-accent-foreground">
          Crear meta
        </Link>
      </Card>
    );
  }

  return (
    <>
      {activas.length > 0 && (
        <Card className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-muted">Te falta en total</span>
          <span className="text-xl font-semibold">{formatSoles(totalFalta)}</span>
        </Card>
      )}

      <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
        {activas.map((m) => {
          const pct = m.objetivo > 0 ? (m.aportado / m.objetivo) * 100 : 0;
          const lista = m.falta === 0;
          const porMes = m.fechaObjetivo && !lista ? m.falta / mesesHasta(m.fechaObjetivo) : null;
          return (
            <Link key={m.id} href={`/metas/${m.id}`} className="active:scale-[0.99]">
              <Card className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <CategoriaIcono nombre={m.icono} fallback={Target} className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{m.nombre}</p>
                    <p className="text-xs text-muted">
                      Prioridad {PRIORIDAD[m.prioridad]?.toLowerCase() ?? "—"}
                      {m.fechaObjetivo && ` · para el ${formatFecha(m.fechaObjetivo)}`}
                    </p>
                  </div>
                  <span className={cx("shrink-0 text-sm font-semibold", lista ? "text-success" : "")}>
                    {lista ? "¡Lista!" : `${Math.floor(pct)}%`}
                  </span>
                </div>
                <ProgressBar value={pct} />
                <div className="flex justify-between gap-2 text-sm">
                  <span className="text-muted">
                    {formatSoles(m.aportado)} de {formatSoles(m.objetivo)}
                  </span>
                  {!lista && <span className="font-medium">Faltan {formatSoles(m.falta)}</span>}
                </div>
                {porMes !== null && (
                  <p className="rounded-xl bg-surface-muted px-3 py-2 text-xs text-muted">
                    Ahorra <span className="font-semibold text-foreground">{formatSoles(Math.ceil(porMes * 100) / 100)}</span> al mes para llegar a tiempo
                  </p>
                )}
              </Card>
            </Link>
          );
        })}
      </div>

      {cerradas.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-sm font-semibold text-muted">Cumplidas y canceladas</h2>
          <Card flush className="divide-y divide-border">
            {cerradas.map((m) => (
              <Link key={m.id} href={`/metas/${m.id}`} className="flex min-h-14 items-center gap-3 px-4 py-2 active:bg-surface-muted">
                <CircleCheck className={cx("size-5 shrink-0", m.estado === "COMPLETADA" ? "text-success" : "text-muted")} aria-hidden />
                <span className={cx("min-w-0 flex-1 truncate", m.estado === "CANCELADA" && "text-muted line-through")}>{m.nombre}</span>
                <span className="shrink-0 text-sm text-muted">{formatSoles(m.objetivo)}</span>
              </Link>
            ))}
          </Card>
        </section>
      )}
    </>
  );
}

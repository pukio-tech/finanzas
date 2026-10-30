import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, Plus, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, cx } from "@/components/ui";
import { getCuotas } from "@/lib/data";
import { formatSoles, nombreMes } from "@/lib/format";

export const metadata: Metadata = { title: "Cuotas" };

export default function CuotasPage() {
  return (
    <div className="flex flex-col gap-4 pb-6">
      <PageHeader
        title="Cuotas"
        subtitle="Gastos mensuales que compartes con otras personas."
        action={
          <Link
            href="/cuotas/nueva"
            className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-accent px-3.5 text-sm font-medium text-accent-foreground"
          >
            <Plus className="size-4" aria-hidden />
            Nueva
          </Link>
        }
      />
      <Suspense fallback={<ListaSkeleton />}>
        <ListaCuotas />
      </Suspense>
    </div>
  );
}

async function ListaCuotas() {
  const cuotas = await getCuotas();

  if (cuotas.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <Users className="size-6" aria-hidden />
        </span>
        <div>
          <p className="font-medium">Crea tu primera cuota</p>
          <p className="mt-1 text-sm text-muted">Por ejemplo, un pago de S/ 1,800 al mes entre dos personas.</p>
        </div>
        <Link href="/cuotas/nueva" className="mt-1 flex min-h-11 items-center rounded-xl bg-accent px-4 font-medium text-accent-foreground">
          Crear cuota
        </Link>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {cuotas.map((c) => {
        const actual = c.periodos.find((p) => p.actual);
        return (
          <Link key={c.id} href={`/cuotas/${c.id}`} className="active:scale-[0.99]">
            <Card className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{c.concepto}</p>
                  <p className="text-sm text-muted">
                    {c.participantes.map((p) => p.nombre).join(" · ")}
                  </p>
                </div>
                <ChevronRight className="mt-0.5 size-5 shrink-0 text-muted" aria-hidden />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-surface-muted px-3 py-2">
                  <p className="text-xs text-muted">Atrasado</p>
                  <p className={cx("font-semibold", c.faltanteVencido > 0 ? "text-warning" : "text-success")}>
                    {c.faltanteVencido > 0 ? formatSoles(c.faltanteVencido) : "Al día"}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-muted px-3 py-2">
                  <p className="text-xs text-muted">{actual ? `Falta de ${nombreMes(actual.mes).toLowerCase()}` : "Este mes"}</p>
                  <p className="font-semibold">{actual ? formatSoles(c.faltanteMesActual) : "—"}</p>
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

function ListaSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-3" aria-busy="true" aria-label="Cargando cuotas">
      <div className="h-32 rounded-2xl bg-surface-muted" />
      <div className="h-32 rounded-2xl bg-surface-muted" />
    </div>
  );
}

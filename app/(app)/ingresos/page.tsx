import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Banknote, ChevronRight, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, cx } from "@/components/ui";
import { getIngresos } from "@/lib/data";
import { formatSoles, nombreMes } from "@/lib/format";

export const metadata: Metadata = { title: "Ingresos" };

export default function IngresosPage() {
  return (
    <div className="flex flex-col gap-4 pb-6">
      <PageHeader
        title="Ingresos"
        subtitle="Tu sueldo y lo que te falta cobrar."
        action={
          <Link
            href="/ingresos/nuevo"
            className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-accent px-3.5 text-sm font-medium text-accent-foreground"
          >
            <Plus className="size-4" aria-hidden />
            Nuevo
          </Link>
        }
      />
      <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl bg-surface-muted" />}>
        <Lista />
      </Suspense>
    </div>
  );
}

async function Lista() {
  const ingresos = await getIngresos();

  if (ingresos.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <Banknote className="size-6" aria-hidden />
        </span>
        <div>
          <p className="font-medium">Agrega tu sueldo</p>
          <p className="mt-1 text-sm text-muted">Por ejemplo, S/ 900 al mes de tu trabajo.</p>
        </div>
        <Link href="/ingresos/nuevo" className="mt-1 flex min-h-11 items-center rounded-xl bg-accent px-4 font-medium text-accent-foreground">
          Agregar ingreso
        </Link>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {ingresos.map((i) => {
        const actual = i.meses.find((m) => m.actual);
        return (
          <Link key={i.id} href={`/ingresos/${i.id}`} className="active:scale-[0.99]">
            <Card className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{i.nombre}</p>
                  <p className="text-sm text-muted">{formatSoles(i.montoMensual)} al mes</p>
                </div>
                <ChevronRight className="mt-0.5 size-5 shrink-0 text-muted" aria-hidden />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className={cx("rounded-xl px-3 py-2", i.porCobrarVencido > 0 ? "bg-warning-soft" : "bg-success-soft")}>
                  <p className={cx("text-xs", i.porCobrarVencido > 0 ? "text-warning" : "text-success")}>Te deben</p>
                  <p className={cx("font-semibold", i.porCobrarVencido > 0 ? "text-warning" : "text-success")}>
                    {i.porCobrarVencido > 0 ? formatSoles(i.porCobrarVencido) : "Al día"}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-muted px-3 py-2">
                  <p className="text-xs text-muted">{actual ? `Falta de ${nombreMes(actual.mes).toLowerCase()}` : "Este mes"}</p>
                  <p className="font-semibold">{actual ? formatSoles(i.porCobrarMesActual) : "—"}</p>
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

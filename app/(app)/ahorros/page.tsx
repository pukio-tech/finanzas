import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, PiggyBank, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Soles } from "@/components/soles";
import { Card } from "@/components/ui";
import { getCuentas } from "@/lib/data";
import { formatFecha, formatSoles } from "@/lib/format";

export const metadata: Metadata = { title: "Ahorros" };

export default function AhorrosPage() {
  return (
    <div className="flex flex-col gap-4 pb-6">
      <PageHeader
        title="Ahorros"
        subtitle="Plata que juntas aparte, sin monto fijo al mes"
        action={
          <Link
            href="/ahorros/nueva"
            className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-[10px] bg-accent px-3.5 text-sm font-medium text-accent-foreground"
          >
            <Plus className="size-4" aria-hidden />
            Nueva
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
  const cuentas = await getCuentas();

  if (cuentas.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <PiggyBank className="size-6" aria-hidden />
        </span>
        <div>
          <p className="font-medium">Crea tu primera cuenta</p>
          <p className="mt-1 text-sm text-muted">Por ejemplo PEYA o tus detracciones: agregas la plata cuando te llega</p>
        </div>
        <Link href="/ahorros/nueva" className="mt-1 flex min-h-11 items-center rounded-[10px] bg-accent px-4 font-medium text-accent-foreground">
          Nueva cuenta
        </Link>
      </Card>
    );
  }

  const total = cuentas.reduce((t, c) => t + Math.round(c.saldo * 100), 0) / 100;
  const esteMes = cuentas.reduce((t, c) => t + Math.round(c.entroEsteMes * 100), 0) / 100;

  return (
    <div className="flex flex-col gap-4">
      {cuentas.length > 1 && (
        <Card className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
          <div>
            <p className="text-sm text-muted">Total en tus cuentas</p>
            <p className="text-[32px] leading-tight font-medium tracking-tight">
              <Soles value={total} />
            </p>
          </div>
          {esteMes > 0 && <p className="text-sm text-success">+ {formatSoles(esteMes)} este mes</p>}
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
        {cuentas.map((c) => (
          <Link key={c.id} href={`/ahorros/${c.id}`} className="active:scale-[0.99]">
            <Card className="flex h-full flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 truncate font-medium">{c.nombre}</p>
                <ChevronRight className="mt-0.5 size-4.5 shrink-0 text-muted" aria-hidden />
              </div>
              <p className="text-2xl font-medium tracking-tight">
                <Soles value={c.saldo} />
              </p>
              <p className="text-sm text-muted">
                {c.entroEsteMes > 0 ? (
                  <span className="text-success">+ {formatSoles(c.entroEsteMes)} este mes</span>
                ) : (
                  "Nada este mes"
                )}
                {c.ultimo && ` · último movimiento ${formatFecha(c.ultimo)}`}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

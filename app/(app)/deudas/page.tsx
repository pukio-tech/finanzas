import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, HandCoins, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, ProgressBar, cx } from "@/components/ui";
import { getDeudas } from "@/lib/data";
import { hoyISO, isoDesdeFecha } from "@/lib/fechas";
import { formatFecha, formatSoles } from "@/lib/format";

export const metadata: Metadata = { title: "Deudas" };

export default function DeudasPage() {
  return (
    <div className="flex flex-col gap-4 pb-6">
      <PageHeader
        title="Deudas"
        subtitle="Lo que debes y lo que te deben."
        action={
          <Link
            href="/deudas/nueva"
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

type Deuda = Awaited<ReturnType<typeof getDeudas>>[number];

async function Lista() {
  const deudas = await getDeudas();
  const hoy = hoyISO();

  if (deudas.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <HandCoins className="size-6" aria-hidden />
        </span>
        <div>
          <p className="font-medium">No tienes deudas registradas</p>
          <p className="mt-1 text-sm text-muted">Anota lo que debes o lo que te prestaste para no olvidarlo.</p>
        </div>
        <Link href="/deudas/nueva" className="mt-1 flex min-h-11 items-center rounded-xl bg-accent px-4 font-medium text-accent-foreground">
          Agregar deuda
        </Link>
      </Card>
    );
  }

  const total = (ds: Deuda[]) => Math.round(ds.reduce((s, d) => s + d.pendiente, 0) * 100) / 100;
  const debo = deudas.filter((d) => d.tipo === "DEBO");
  const meDeben = deudas.filter((d) => d.tipo === "ME_DEBEN");

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3.5">
          <p className="flex items-center gap-1 text-xs text-muted">
            <ArrowUpRight className="size-3.5" aria-hidden /> Debes
          </p>
          <p className={cx("mt-1 text-lg font-semibold", total(debo) > 0 && "text-danger")}>{formatSoles(total(debo))}</p>
        </Card>
        <Card className="p-3.5">
          <p className="flex items-center gap-1 text-xs text-muted">
            <ArrowDownLeft className="size-3.5" aria-hidden /> Te deben
          </p>
          <p className={cx("mt-1 text-lg font-semibold", total(meDeben) > 0 && "text-success")}>{formatSoles(total(meDeben))}</p>
        </Card>
      </div>

      <Grupo titulo="Lo que debes" deudas={debo} hoy={hoy} vacio="No le debes a nadie." />
      <Grupo titulo="Lo que te deben" deudas={meDeben} hoy={hoy} vacio="Nadie te debe." />
    </>
  );
}

function Grupo({ titulo, deudas, hoy, vacio }: { titulo: string; deudas: Deuda[]; hoy: string; vacio: string }) {
  const abiertas = deudas.filter((d) => d.pendiente > 0);
  const saldadas = deudas.filter((d) => d.pendiente === 0);

  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-1 text-base font-semibold">{titulo}</h2>
      {abiertas.length === 0 && <p className="px-1 text-sm text-muted">{vacio}</p>}
      {abiertas.map((d) => {
        const vencida = d.fechaLimite && isoDesdeFecha(d.fechaLimite) < hoy;
        return (
          <Link key={d.id} href={`/deudas/${d.id}`} className="active:scale-[0.99]">
            <Card className="flex flex-col gap-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{d.contraparte}</p>
                  {d.descripcion && <p className="truncate text-xs text-muted">{d.descripcion}</p>}
                </div>
                <span className="shrink-0 font-semibold">{formatSoles(d.pendiente)}</span>
              </div>
              <ProgressBar value={d.monto > 0 ? (d.abonado / d.monto) * 100 : 0} />
              <div className="flex justify-between gap-2 text-xs text-muted">
                <span>
                  {formatSoles(d.abonado)} de {formatSoles(d.monto)}
                </span>
                {d.fechaLimite && (
                  <span className={cx(vencida && "font-medium text-danger")}>
                    {vencida ? "Venció" : "Hasta"} el {formatFecha(d.fechaLimite)}
                  </span>
                )}
              </div>
            </Card>
          </Link>
        );
      })}
      {saldadas.length > 0 && (
        <Card flush className="divide-y divide-border">
          {saldadas.map((d) => (
            <Link key={d.id} href={`/deudas/${d.id}`} className="flex min-h-12 items-center justify-between gap-3 px-4 active:bg-surface-muted">
              <span className="truncate text-muted">{d.contraparte}</span>
              <span className="shrink-0 text-xs font-medium text-success">Saldada · {formatSoles(d.monto)}</span>
            </Link>
          ))}
        </Card>
      )}
    </section>
  );
}

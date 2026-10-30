import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, Receipt } from "lucide-react";
import { Card, ProgressBar, cx } from "@/components/ui";
import { getResumen } from "@/lib/data";
import { formatFecha, formatSoles } from "@/lib/format";

export default function InicioPage() {
  return (
    <Suspense fallback={<ResumenSkeleton />}>
      <Resumen />
    </Suspense>
  );
}

async function Resumen() {
  const r = await getResumen();
  const faltanteCuotas = r.cuotas.reduce((s, c) => s + c.faltantePropio, 0);

  return (
    <div className="flex flex-col gap-5 pb-6">
      <header className="pt-2">
        <p className="text-sm text-muted">Hola, {r.user.nombre.split(" ")[0]}</p>
        <p className="mt-1 text-[34px] font-semibold leading-tight tracking-tight">
          {formatSoles(r.ahorroActual)}
        </p>
        <p className="text-sm text-muted">
          Ahorro actual · {formatSoles(r.ahorroMensual)} al mes
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Te falta en cuotas" value={faltanteCuotas} tone={faltanteCuotas > 0 ? "warning" : "success"} href="/cuotas" />
        <Stat label="Debes" value={r.debo} tone={r.debo > 0 ? "danger" : "muted"} href="/deudas" />
        <Stat label="Te deben" value={r.meDeben} tone="muted" href="/deudas" className="col-span-2 sm:col-span-1" />
      </div>

      <section className="flex flex-col gap-3">
        <SectionTitle title="Metas" href="/metas" />
        <Card className="flex flex-col gap-4">
          {r.metas.length === 0 && <Empty text="Agrega lo que quieres comprar o pagar." />}
          {r.metas.map((m) => {
            const pct = m.objetivo > 0 ? (m.aportado / m.objetivo) * 100 : 0;
            return (
              <div key={m.id} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate font-medium">{m.nombre}</span>
                  <span className="shrink-0 text-sm text-muted">
                    {formatSoles(m.aportado)} / {formatSoles(m.objetivo)}
                  </span>
                </div>
                <ProgressBar value={pct} />
              </div>
            );
          })}
        </Card>
      </section>

      {r.cuotas.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle title="Cuotas" href="/cuotas" />
          <Card flush className="divide-y divide-border">
            {r.cuotas.map((c) => (
              <Link key={c.id} href={`/cuotas/${c.id}`} className="flex min-h-12 items-center justify-between gap-3 px-4 py-3 active:bg-surface-muted">
                <span className="truncate">{c.concepto}</span>
                <span className={cx("shrink-0 text-sm font-medium", c.faltanteTotal > 0 ? "text-warning" : "text-success")}>
                  {c.faltanteTotal > 0 ? `Faltan ${formatSoles(c.faltanteTotal)}` : "Al día"}
                </span>
              </Link>
            ))}
          </Card>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <SectionTitle title="Últimos pagos" href="/pagos" />
        <Card flush className="divide-y divide-border">
          {r.ultimosPagos.length === 0 && (
            <div className="p-4">
              <Empty text="Aún no registras pagos. Usa el botón + para agregar uno." />
            </div>
          )}
          {r.ultimosPagos.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-muted">
                <Receipt className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate">{p.descripcion}</p>
                <p className="text-xs text-muted">
                  {formatFecha(p.fecha)}
                  {p.categoria && ` · ${p.categoria}`}
                </p>
              </div>
              <span className="shrink-0 font-medium">{formatSoles(p.monto)}</span>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  href,
  className,
}: {
  label: string;
  value: number;
  tone: "warning" | "danger" | "success" | "muted";
  href: string;
  className?: string;
}) {
  return (
    <Link href={href} className={cx("rounded-2xl border border-border bg-surface p-3.5 active:scale-[0.98]", className)}>
      <p className="text-xs text-muted">{label}</p>
      <p
        className={cx(
          "mt-1 text-lg font-semibold",
          tone === "warning" && "text-warning",
          tone === "danger" && "text-danger",
          tone === "success" && "text-success",
        )}
      >
        {formatSoles(value)}
      </p>
    </Link>
  );
}

function SectionTitle({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-base font-semibold">{title}</h2>
      <Link href={href} className="flex min-h-11 items-center gap-0.5 px-1 text-sm text-accent">
        Ver todo <ChevronRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-muted">{text}</p>;
}

function ResumenSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-5 pt-2" aria-busy="true" aria-label="Cargando resumen">
      <div className="h-4 w-24 rounded bg-surface-muted" />
      <div className="h-10 w-48 rounded bg-surface-muted" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="h-20 rounded-2xl bg-surface-muted" />
        <div className="h-20 rounded-2xl bg-surface-muted" />
        <div className="col-span-2 h-20 rounded-2xl bg-surface-muted sm:col-span-1" />
      </div>
      <div className="h-40 rounded-2xl bg-surface-muted" />
    </div>
  );
}

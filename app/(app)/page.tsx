import { Suspense } from "react";
import Link from "next/link";
import { Banknote, ChartLine, ChevronRight } from "lucide-react";
import { CategoriaIcono } from "@/components/categoria-icono";
import { Card, ProgressBar, cx } from "@/components/ui";
import { getProyeccion, getResumen } from "@/lib/data";
import { formatFecha, formatSoles, nombreMes } from "@/lib/format";

export default function InicioPage() {
  return (
    <Suspense fallback={<ResumenSkeleton />}>
      <Resumen />
    </Suspense>
  );
}

async function Resumen() {
  const [r, p] = await Promise.all([getResumen(), getProyeccion()]);
  const porCobrarTotal = Math.round((p.porCobrarVencido + p.ingresosFuturos) * 100) / 100;
  const separado = Math.round(r.metas.reduce((s, m) => s + m.aportado, 0) * 100) / 100;

  return (
    <div className="flex flex-col gap-5 pb-6 lg:gap-6">
      <h1 className="-mb-4 pt-2 text-sm text-muted lg:mb-0 lg:text-2xl lg:font-semibold lg:tracking-tight lg:text-foreground">
        Hola, {r.user.nombre.split(" ")[0]}
      </h1>

      {/* En escritorio, las tres cifras clave van lado a lado. */}
      <div className="grid gap-5 lg:grid-cols-3 lg:gap-4">
        <header className="lg:flex lg:flex-col lg:justify-center lg:rounded-2xl lg:border lg:border-border lg:bg-surface lg:p-5">
          <p className="hidden text-xs text-muted lg:block">Dinero libre</p>
          <p className="mt-1 text-[34px] font-semibold leading-tight tracking-tight">
            {formatSoles(r.ahorroActual)}
          </p>
          <p className="text-sm text-muted">
            <Link href="/proyeccion" className="lg:hidden">
              Dinero libre
            </Link>
            {separado > 0 && (
              <>
                <span className="lg:hidden">{" · "}</span>
                <Link href="/metas" className="text-accent">
                  {formatSoles(separado)} separado en metas
                </Link>
              </>
            )}
          </p>
        </header>

        <Link href="/ingresos" className="active:scale-[0.99]">
          <Card className="flex h-full flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted">
                  Ingresos por cobrar hasta {nombreMes(p.hasta.mes).toLowerCase()} {p.hasta.anio}
                </p>
                <p className="mt-0.5 text-2xl font-semibold tracking-tight">{formatSoles(porCobrarTotal)}</p>
              </div>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <Banknote className="size-5" aria-hidden />
              </span>
            </div>
            {r.ingresos.length === 0 ? (
              <p className="text-sm text-accent">Agrega tu sueldo para ver cuánto vas a recibir</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className={cx("rounded-xl px-3 py-2", p.porCobrarVencido > 0 ? "bg-warning-soft" : "bg-surface-muted")}>
                  <p className={cx("text-xs", p.porCobrarVencido > 0 ? "text-warning" : "text-muted")}>Te deben del trabajo</p>
                  <p className={cx("font-semibold", p.porCobrarVencido > 0 && "text-warning")}>{formatSoles(p.porCobrarVencido)}</p>
                </div>
                <div className="rounded-xl bg-surface-muted px-3 py-2">
                  <p className="text-xs text-muted">
                    Próximos {p.meses.length} {p.meses.length === 1 ? "mes" : "meses"}
                  </p>
                  <p className="font-semibold">{formatSoles(p.ingresosFuturos)}</p>
                </div>
              </div>
            )}
          </Card>
        </Link>

        <Link href="/proyeccion" className="active:scale-[0.99]">
          <Card className="flex h-full items-center gap-3">
            <span className={cx("flex size-10 shrink-0 items-center justify-center rounded-xl", p.restante >= 0 ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}>
              <ChartLine className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted">
                Proyección a {nombreMes(p.hasta.mes).toLowerCase()} {p.hasta.anio}: te {p.restante >= 0 ? "sobrarían" : "faltarían"}
              </p>
              <p className={cx("mt-0.5 text-xl font-semibold tracking-tight lg:text-2xl", p.restante >= 0 ? "text-success" : "text-danger")}>
                {formatSoles(Math.abs(p.restante))}
              </p>
            </div>
            <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
          </Card>
        </Link>
      </div>

      {(r.debo > 0 || r.meDeben > 0) && (
        <div className="grid grid-cols-2 gap-3 lg:gap-4">
          <Stat label="Debes" value={r.debo} tone={r.debo > 0 ? "danger" : "muted"} href="/deudas" />
          <Stat label="Te deben" value={r.meDeben} tone="muted" href="/deudas" />
        </div>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-2 lg:gap-6">
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

        <section className="flex flex-col gap-3">
          <SectionTitle title="Últimos pagos" href="/pagos" />
          <Card flush className="divide-y divide-border">
            {r.ultimosPagos.length === 0 && (
              <div className="p-4">
                <Empty text="Aún no registras pagos. Usa el botón + para agregar uno." />
              </div>
            )}
            {r.ultimosPagos.map((p) => (
              <Link key={p.id} href={`/pagos/${p.id}`} className="flex min-h-16 items-center gap-3 px-4 py-3 active:bg-surface-muted">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-muted">
                  <CategoriaIcono nombre={p.icono} className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate">{p.descripcion}</p>
                  <p className="text-xs text-muted">
                    {formatFecha(p.fecha)}
                    {p.categoria && ` · ${p.categoria}`}
                  </p>
                </div>
                <span className="shrink-0 font-medium">{formatSoles(p.monto)}</span>
              </Link>
            ))}
          </Card>
        </section>
      </div>
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

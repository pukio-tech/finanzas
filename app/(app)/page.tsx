import { Suspense } from "react";
import Link from "next/link";
import { Banknote, ChevronRight, HandCoins } from "lucide-react";
import { CategoriaIcono } from "@/components/categoria-icono";
import { Card, ProgressBar, cx } from "@/components/ui";
import { getResumen } from "@/lib/data";
import { formatFecha, formatSoles, nombreMes } from "@/lib/format";

export default function InicioPage() {
  return (
    <Suspense fallback={<ResumenSkeleton />}>
      <Resumen />
    </Suspense>
  );
}

async function Resumen() {
  const r = await getResumen();
  const separado = Math.round(r.metas.reduce((s, m) => s + m.aportado, 0) * 100) / 100;
  const { teDeben, proximo } = r.sueldo;

  return (
    <div className="flex flex-col gap-5 pb-6 lg:gap-6">
      <h1 className="-mb-4 pt-2 text-sm text-muted lg:mb-0 lg:text-2xl lg:font-semibold lg:tracking-tight lg:text-foreground">
        Hola, {r.user.nombre.split(" ")[0]}
      </h1>

      {/* Lo que tienes hoy. Las proyecciones a futuro viven en /proyeccion. */}
      <div className="grid gap-5 lg:grid-cols-3 lg:gap-4">
        <header className="lg:flex lg:flex-col lg:justify-center lg:rounded-2xl lg:border lg:border-border lg:bg-surface lg:p-5">
          <p className="hidden text-xs text-muted lg:block">Dinero libre</p>
          <p className="mt-1 text-[34px] font-semibold leading-tight tracking-tight">
            {formatSoles(r.ahorroActual)}
          </p>
          <p className="text-sm text-muted">
            <span className="lg:hidden">Dinero libre</span>
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
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">Tu sueldo</p>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <Banknote className="size-5" aria-hidden />
              </span>
            </div>
            {r.ingresos.length === 0 ? (
              <p className="text-sm text-accent">Agrega tu sueldo para ver cuánto te deben y tu próximo pago</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className={cx("rounded-xl px-3 py-2", teDeben > 0 ? "bg-warning-soft" : "bg-success-soft")}>
                  <p className={cx("text-xs", teDeben > 0 ? "text-warning" : "text-success")}>Te deben</p>
                  <p className={cx("text-lg font-semibold", teDeben > 0 ? "text-warning" : "text-success")}>
                    {teDeben > 0 ? formatSoles(teDeben) : "Al día"}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-muted px-3 py-2">
                  <p className="text-xs text-muted">
                    {proximo ? `Próximo pago · ${nombreMes(proximo.mes).toLowerCase()}` : "Próximo pago"}
                  </p>
                  <p className="text-lg font-semibold">{proximo ? formatSoles(proximo.monto) : "—"}</p>
                </div>
              </div>
            )}
          </Card>
        </Link>

        <Link href="/deudas" className="active:scale-[0.99]">
          <Card className="flex h-full flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">Deudas</p>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-muted">
                <HandCoins className="size-5" aria-hidden />
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-surface-muted px-3 py-2">
                <p className="text-xs text-muted">Debes</p>
                <p className={cx("text-lg font-semibold", r.debo > 0 && "text-danger")}>{formatSoles(r.debo)}</p>
              </div>
              <div className="rounded-xl bg-surface-muted px-3 py-2">
                <p className="text-xs text-muted">Te deben</p>
                <p className={cx("text-lg font-semibold", r.meDeben > 0 && "text-success")}>{formatSoles(r.meDeben)}</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

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

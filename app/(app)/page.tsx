import { Soles } from "@/components/soles";
import { Suspense } from "react";
import Link from "next/link";
import { Banknote, ChevronRight, HandCoins } from "lucide-react";
import { CategoriaIcono } from "@/components/categoria-icono";
import { Card, ProgressBar, cx } from "@/components/ui";
import { getResumen } from "@/lib/data";
import { mesActual } from "@/lib/fechas";
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
  const { teDeben, proximo, meses } = r.sueldo;
  const hoy = mesActual();

  return (
    <div className="flex flex-col gap-5 pb-6 lg:gap-6">
      <h1 className="pt-2 text-2xl font-medium tracking-tight">
        {nombreMes(hoy.mes)} {hoy.anio}
      </h1>

      {/* Lo que tienes hoy. Las proyecciones a futuro viven en /proyeccion. */}
      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="flex flex-col justify-center gap-1 lg:p-5">
          <p className="text-sm text-muted">Dinero libre</p>
          <p className="text-[32px] leading-tight font-medium tracking-tight">
            <Soles value={r.ahorroActual} />
          </p>
          {separado > 0 && (
            <Link href="/metas" className="text-sm text-accent">
              <Soles value={separado} /> separado en metas
            </Link>
          )}
        </Card>

        <Link href="/ingresos" className="active:scale-[0.99] lg:col-span-2">
          <Card className="flex h-full flex-col gap-4 lg:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">Tu sueldo</p>
              <Banknote className="size-4.5 text-muted" aria-hidden />
            </div>
            {r.ingresos.length === 0 ? (
              <p className="text-sm text-accent">Agrega tu sueldo para ver cuánto te deben y tu próximo pago</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted">Te deben</p>
                    <p className={cx("text-2xl font-medium tracking-tight", teDeben > 0 ? "text-warning" : "text-success")}>
                      {teDeben > 0 ? <Soles value={teDeben} /> : "Al día"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted">
                      {proximo ? `Próximo pago · ${nombreMes(proximo.mes).toLowerCase()}` : "Próximo pago"}
                    </p>
                    <p className="text-2xl font-medium tracking-tight">{proximo ? <Soles value={proximo.monto} /> : "—"}</p>
                  </div>
                </div>
                {meses.length > 0 && <FilaMeses meses={meses} />}
              </>
            )}
          </Card>
        </Link>

        <Link href="/deudas" className="active:scale-[0.99]">
          <Card className="flex h-full flex-col gap-4 lg:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">Deudas</p>
              <HandCoins className="size-4.5 text-muted" aria-hidden />
            </div>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted">Debes</dt>
                <dd className={cx("text-lg font-medium", r.debo > 0 && "text-danger")}><Soles value={r.debo} /></dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted">Te deben</dt>
                <dd className={cx("text-lg font-medium", r.meDeben > 0 && "text-success")}><Soles value={r.meDeben} /></dd>
              </div>
            </dl>
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
                      <Soles value={m.aportado} /> / <Soles value={m.objetivo} />
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
                <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-surface-muted text-muted">
                  <CategoriaIcono nombre={p.icono} className="size-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate">{p.descripcion}</p>
                  <p className="text-xs text-muted">
                    {formatFecha(p.fecha)}
                    {p.categoria && ` · ${p.categoria}`}
                  </p>
                </div>
                <span className="shrink-0 font-medium"><Soles value={p.monto} /></span>
              </Link>
            ))}
          </Card>
        </section>
      </div>
    </div>
  );
}

type MesSueldo = {
  anio: number;
  mes: number;
  esperado: number;
  recibido: number;
  falta: number;
  vencido: boolean;
  actual: boolean;
};

// Los meses del sueldo como en la libreta: lleno = cobrado, mitad = cobrado en parte,
// vacío = por cobrar (ámbar si el mes ya pasó).
function FilaMeses({ meses }: { meses: MesSueldo[] }) {
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4">
      <ol className="grid gap-1" style={{ gridTemplateColumns: `repeat(${meses.length}, minmax(0, 1fr))` }}>
        {meses.map((m) => (
          <li
            key={`${m.anio}-${m.mes}`}
            className="flex flex-col items-center gap-2"
            aria-label={`${nombreMes(m.mes)} ${m.anio}: ${
              m.falta === 0 ? "cobrado" : m.recibido > 0 ? `cobraste ${formatSoles(m.recibido)}, faltan ${formatSoles(m.falta)}` : `por cobrar ${formatSoles(m.falta)}`
            }`}
          >
            <Marca mes={m} />
            <span className={cx("text-xs", m.actual ? "font-medium text-foreground" : "text-muted")}>
              {nombreMes(m.mes).slice(0, 3).toLowerCase()}
            </span>
          </li>
        ))}
      </ol>
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1.5"><Marca mes={{ esperado: 1, recibido: 1, falta: 0 }} /> Cobrado</span>
        <span className="flex items-center gap-1.5"><Marca mes={{ esperado: 1, recibido: 1, falta: 1 }} /> En parte</span>
        <span className="flex items-center gap-1.5"><Marca mes={{ esperado: 1, recibido: 0, falta: 1, vencido: true }} /> Te deben</span>
      </p>
    </div>
  );
}

function Marca({ mes }: { mes: Pick<MesSueldo, "esperado" | "recibido" | "falta"> & { vencido?: boolean; actual?: boolean } }) {
  const base = "inline-block size-3 shrink-0 rounded-full";
  if (mes.esperado === 0) return <span className={cx(base, "border border-dashed border-muted")} />;
  if (mes.falta === 0) return <span className={cx(base, "bg-accent")} />;
  if (mes.recibido > 0) {
    return (
      <span
        className={cx(base, "border-2 border-accent")}
        style={{ background: "linear-gradient(90deg, var(--accent) 50%, transparent 50%)" }}
      />
    );
  }
  return (
    <span
      className={cx(base, "border-2", mes.vencido ? "border-warning" : mes.actual ? "border-accent" : "border-border")}
    />
  );
}

function SectionTitle({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-base font-medium">{title}</h2>
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

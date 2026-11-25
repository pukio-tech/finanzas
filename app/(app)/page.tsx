import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { Banknote, ChartLine, ChevronRight, HandCoins, SlidersHorizontal, Store } from "lucide-react";
import { CategoriaIcono } from "@/components/categoria-icono";
import { Soles } from "@/components/soles";
import { Card, ProgressBar, cx } from "@/components/ui";
import { getConfigInicio, getProyeccion, getResumen } from "@/lib/data";
import { mesActual } from "@/lib/fechas";
import { formatFecha, formatSoles, nombreMes } from "@/lib/format";
import { acomodarFilas, type Tarjeta } from "@/lib/inicio";

export default function InicioPage() {
  return (
    <Suspense fallback={<ResumenSkeleton />}>
      <Resumen />
    </Suspense>
  );
}

async function Resumen() {
  const config = await getConfigInicio();
  const elegidas = config.orden.filter((t) => !config.ocultas.includes(t));
  const [r, p] = await Promise.all([
    getResumen({ pagos: config.pagosCantidad }),
    // La proyección solo se calcula si su tarjeta está visible.
    elegidas.includes("proyeccion") ? getProyeccion() : null,
  ]);
  // "Ingresos aparte" solo sale si tienes alguno.
  const visibles = elegidas.filter((t) => t !== "aparte" || r.aparte.length > 0);
  const hoy = mesActual();
  const metas = config.metasCantidad > 0 ? r.metas.slice(0, config.metasCantidad) : r.metas;
  const separado = Math.round(r.metas.reduce((s, m) => s + m.aportado, 0) * 100) / 100;
  const { teDeben, proximo, meses } = r.sueldo;

  const tarjetas: Record<Tarjeta, () => ReactNode> = {
    dinero: () => (
      <Card className="flex h-full flex-col justify-center gap-1 lg:p-5">
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
    ),
    sueldo: () => (
      <Link href="/ingresos" className="block h-full active:scale-[0.99]">
        <Card className="flex h-full flex-col gap-4 lg:p-5">
          <Encabezado titulo="Tu sueldo" icono={<Banknote className="size-4.5 text-muted" aria-hidden />} />
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
              {config.sueldoMeses && meses.length > 0 && <FilaMeses meses={meses} />}
            </>
          )}
        </Card>
      </Link>
    ),
    aparte: () => (
      <Card flush className="flex h-full flex-col">
        <div className="px-4 pt-3 lg:px-5">
          <Encabezado titulo="Ingresos aparte" icono={<Store className="size-4.5 text-muted" aria-hidden />} />
        </div>
        <div className="divide-y divide-border">
          {r.aparte.map((i) => (
            <Link
              key={i.id}
              href={`/ingresos/${i.id}`}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-x-5 px-4 py-3 active:bg-surface-muted lg:px-5"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{i.nombre}</p>
                <p className="text-xs text-muted">
                  <Soles value={i.montoMensual} /> al mes
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted">Cobrado</p>
                <p className="font-medium">
                  <Soles value={i.cobrado} />
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted">Te deben</p>
                <p className={cx("font-medium", i.teDeben > 0 ? "text-warning" : "text-success")}>
                  {i.teDeben > 0 ? <Soles value={i.teDeben} /> : "Al día"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    ),
    deudas: () => (
      <Link href="/deudas" className="block h-full active:scale-[0.99]">
        <Card className="flex h-full flex-col gap-4 lg:p-5">
          <Encabezado titulo="Deudas" icono={<HandCoins className="size-4.5 text-muted" aria-hidden />} />
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted">Debes</dt>
              <dd className={cx("text-lg font-medium", r.debo > 0 && "text-danger")}>
                <Soles value={r.debo} />
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted">Te deben</dt>
              <dd className={cx("text-lg font-medium", r.meDeben > 0 && "text-success")}>
                <Soles value={r.meDeben} />
              </dd>
            </div>
          </dl>
        </Card>
      </Link>
    ),
    proyeccion: () =>
      p && (
        <Link href="/proyeccion" className="block h-full active:scale-[0.99]">
          <Card className="flex h-full flex-col gap-3 lg:p-5">
            <Encabezado titulo="Proyección" icono={<ChartLine className="size-4.5 text-muted" aria-hidden />} />
            <div>
              <p className="text-sm text-muted">
                A {nombreMes(p.hasta.mes).toLowerCase()} {p.hasta.anio} te {p.restante >= 0 ? "sobrarían" : "faltarían"}
              </p>
              <p className={cx("text-2xl font-medium tracking-tight", p.restante >= 0 ? "text-success" : "text-danger")}>
                <Soles value={Math.abs(p.restante)} />
              </p>
            </div>
          </Card>
        </Link>
      ),
    metas: () => (
      <Card className="flex h-full flex-col gap-4">
        <Encabezado titulo="Metas" href="/metas" />
        {metas.length === 0 && <Empty text="Agrega lo que quieres comprar o pagar." />}
        {metas.map((m) => {
          const pct = m.objetivo > 0 ? (m.aportado / m.objetivo) * 100 : 0;
          return (
            <Link key={m.id} href={`/metas/${m.id}`} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate font-medium">{m.nombre}</span>
                <span className="shrink-0 text-sm text-muted">
                  <Soles value={m.aportado} /> / <Soles value={m.objetivo} />
                </span>
              </div>
              <ProgressBar value={pct} />
            </Link>
          );
        })}
      </Card>
    ),
    pagos: () => (
      <Card flush className="flex h-full flex-col">
        <div className="px-4 pt-3">
          <Encabezado titulo="Últimos pagos" href="/pagos" />
        </div>
        <div className="divide-y divide-border">
          {r.ultimosPagos.length === 0 && (
            <div className="px-4 pb-4">
              <Empty text="Aún no registras pagos. Usa el botón + para agregar uno." />
            </div>
          )}
          {r.ultimosPagos.map((pago) => (
            <Link
              key={pago.id}
              href={`/pagos/${pago.id}`}
              className="flex min-h-16 items-center gap-3 px-4 py-3 active:bg-surface-muted"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-surface-muted text-muted">
                <CategoriaIcono nombre={pago.icono} className="size-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate">{pago.descripcion}</p>
                <p className="text-xs text-muted">
                  {formatFecha(pago.fecha)}
                  {pago.categoria && ` · ${pago.categoria}`}
                </p>
              </div>
              <span className="shrink-0 font-medium">
                <Soles value={pago.monto} />
              </span>
            </Link>
          ))}
        </div>
      </Card>
    ),
  };

  return (
    <div className="flex flex-col gap-5 pb-6 lg:gap-6">
      <header className="flex items-end justify-between gap-3 pt-2">
        <div className="min-w-0">
          <p className="text-sm text-muted">Hola, {primerNombre(r.user.nombre)}</p>
          <h1 className="text-2xl font-medium tracking-tight">
            {nombreMes(hoy.mes)} {hoy.anio}
          </h1>
        </div>
        <Link
          href="/personalizar"
          aria-label="Personalizar inicio"
          className="flex min-h-11 shrink-0 items-center gap-2 rounded-[10px] border border-border bg-surface px-3 text-sm text-muted transition-[color,background-color,border-color,transform] hover:bg-surface-muted hover:text-foreground"
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          <span className="hidden sm:inline">Personalizar</span>
        </Link>
      </header>

      {visibles.length === 0 ? (
        <Card className="py-10 text-center">
          <p className="font-medium">Ocultaste todas las tarjetas</p>
          <Link href="/personalizar" className="mt-1 inline-block text-sm text-accent">
            Elegir qué mostrar
          </Link>
        </Card>
      ) : (
        // En escritorio, filas de 4 columnas en el orden elegido; la última tarjeta de cada fila se estira.
        <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-4">
          {acomodarFilas(visibles).map(({ tarjeta, columnas }) => (
            <div key={tarjeta} className={cx("min-w-0", SPAN[columnas])}>
              {tarjetas[tarjeta]()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const SPAN: Record<number, string> = {
  1: "lg:col-span-1",
  2: "lg:col-span-2",
  3: "lg:col-span-3",
  4: "lg:col-span-4",
};

function Encabezado({ titulo, icono, href }: { titulo: string; icono?: ReactNode; href?: string }) {
  return (
    <div className="flex min-h-9 items-center justify-between gap-3">
      <p className="font-medium">{titulo}</p>
      {href ? (
        <Link href={href} className="flex min-h-11 items-center gap-0.5 text-sm text-accent">
          Ver todo <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : (
        icono
      )}
    </div>
  );
}

// "RONAL JAMES LLAPAPASCA" → "Ronal": primer nombre con mayúscula inicial.
function primerNombre(nombre: string) {
  const primero = nombre.trim().split(/\s+/)[0] ?? "";
  return primero.charAt(0).toUpperCase() + primero.slice(1).toLowerCase();
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

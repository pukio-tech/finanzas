import type { Metadata } from "next";
import { Suspense } from "react";
import { io } from "next/cache";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Paperclip, Plus } from "lucide-react";
import { CategoriaIcono } from "@/components/categoria-icono";
import { PageHeader } from "@/components/page-header";
import { Card, cx } from "@/components/ui";
import { getPagos } from "@/lib/data";
import { mesActual, sumarMeses, type MesAnio } from "@/lib/fechas";
import { formatFecha, formatSoles, nombreMes } from "@/lib/format";

export const metadata: Metadata = { title: "Pagos realizados" };

export default function PagosPage({ searchParams }: PageProps<"/pagos">) {
  return (
    <div className="flex flex-col gap-4 pb-6">
      <PageHeader
        title="Pagos realizados"
        action={
          <Link
            href="/pagos/nuevo"
            className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-accent px-3.5 text-sm font-medium text-accent-foreground"
          >
            <Plus className="size-4" aria-hidden />
            Nuevo
          </Link>
        }
      />
      <Suspense fallback={<ListaSkeleton />}>
        <Lista searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function leerMes(valor: unknown): MesAnio {
  const match = typeof valor === "string" && /^(\d{4})-(0[1-9]|1[0-2])$/.exec(valor);
  return match ? { anio: Number(match[1]), mes: Number(match[2]) } : mesActual();
}

const claveMes = ({ anio, mes }: MesAnio) => `${anio}-${String(mes).padStart(2, "0")}`;

async function Lista({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  // mesActual() lee la fecha de hoy: debe calcularse en cada petición.
  await io();
  const mes = leerMes(sp.mes);
  const categoriaId = typeof sp.cat === "string" ? sp.cat : undefined;
  const { pagos, categorias, total } = await getPagos({ ...mes, categoriaId });

  const href = (m: MesAnio, cat?: string) => {
    const params = new URLSearchParams({ mes: claveMes(m) });
    if (cat) params.set("cat", cat);
    return `/pagos?${params}`;
  };
  const esMesActual = claveMes(mes) === claveMes(mesActual());

  // Agrupa por día para leer el historial más fácil en el celular.
  const porDia = new Map<string, typeof pagos>();
  for (const p of pagos) {
    const dia = formatFecha(p.fecha);
    porDia.set(dia, [...(porDia.get(dia) ?? []), p]);
  }

  return (
    <>
      <Card className="flex items-center justify-between gap-2 p-2">
        <Link href={href(sumarMeses(mes, -1), categoriaId)} aria-label="Mes anterior" className="flex size-11 items-center justify-center rounded-xl hover:bg-surface-muted">
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
        <div className="text-center">
          <p className="font-semibold">
            {nombreMes(mes.mes)} {mes.anio}
          </p>
          <p className="text-sm text-muted">Total: {formatSoles(total)}</p>
        </div>
        <Link
          href={href(sumarMeses(mes, 1), categoriaId)}
          aria-label="Mes siguiente"
          aria-disabled={esMesActual}
          className={cx("flex size-11 items-center justify-center rounded-xl hover:bg-surface-muted", esMesActual && "pointer-events-none opacity-30")}
        >
          <ChevronRight className="size-5" aria-hidden />
        </Link>
      </Card>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        <Link
          href={href(mes)}
          className={cx(
            "flex min-h-10 shrink-0 items-center rounded-full border px-3.5 text-sm",
            !categoriaId ? "border-accent bg-accent-soft font-medium text-accent" : "border-border bg-surface",
          )}
        >
          Todas
        </Link>
        {categorias.map((c) => (
          <Link
            key={c.id}
            href={href(mes, c.id)}
            className={cx(
              "flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm",
              categoriaId === c.id ? "border-accent bg-accent-soft font-medium text-accent" : "border-border bg-surface",
            )}
          >
            <CategoriaIcono nombre={c.icono} className="size-4" />
            {c.nombre}
          </Link>
        ))}
      </div>

      {pagos.length === 0 ? (
        <Card className="py-10 text-center">
          <p className="font-medium">No hay pagos en este mes</p>
          <p className="mt-1 text-sm text-muted">Usa el botón + para registrar uno.</p>
        </Card>
      ) : (
        [...porDia].map(([dia, items]) => (
          <section key={dia} className="flex flex-col gap-2">
            <h2 className="px-1 text-xs font-medium tracking-wide text-muted uppercase">{dia}</h2>
            <Card flush className="divide-y divide-border">
              {items.map((p) => (
                <Link key={p.id} href={`/pagos/${p.id}`} className="flex min-h-16 items-center gap-3 px-4 py-2.5 active:bg-surface-muted">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-muted">
                    <CategoriaIcono nombre={p.categoria?.icono} className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{p.descripcion}</p>
                    <p className="truncate text-xs text-muted">
                      {[p.categoria?.nombre, p.vinculo].filter(Boolean).join(" · ") || "Sin categoría"}
                    </p>
                  </div>
                  {p.tieneVoucher && <Paperclip className="size-4 shrink-0 text-muted" aria-label="Con voucher" />}
                  <span className="shrink-0 font-medium">{formatSoles(p.monto)}</span>
                </Link>
              ))}
            </Card>
          </section>
        ))
      )}
    </>
  );
}

function ListaSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-3" aria-busy="true" aria-label="Cargando pagos">
      <div className="h-16 rounded-2xl bg-surface-muted" />
      <div className="h-10 rounded-full bg-surface-muted" />
      <div className="h-48 rounded-2xl bg-surface-muted" />
    </div>
  );
}

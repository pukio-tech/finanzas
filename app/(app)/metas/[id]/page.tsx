import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { CircleCheck, Pencil, Receipt, RotateCcw, Target, Trash2, X } from "lucide-react";
import { CategoriaIcono } from "@/components/categoria-icono";
import { ConfirmButton } from "@/components/confirm-button";
import { MovimientoForm } from "@/components/movimiento-form";
import { PageHeader } from "@/components/page-header";
import { Card, ProgressBar } from "@/components/ui";
import { getMeta } from "@/lib/data";
import { hoyISO, mesesHasta } from "@/lib/fechas";
import { formatFecha, formatSoles } from "@/lib/format";
import { agregarAporte, cambiarEstadoMeta, eliminarAporte, eliminarMeta } from "../actions";

export const metadata: Metadata = { title: "Meta" };

export default function MetaPage({ params }: PageProps<"/metas/[id]">) {
  return (
    <Suspense fallback={<div className="mt-12 h-96 animate-pulse rounded-2xl bg-surface-muted" />}>
      <Detalle params={params} />
    </Suspense>
  );
}

const ESTADO = { ACTIVA: "Activa", COMPLETADA: "Cumplida", CANCELADA: "Cancelada" } as const;

async function Detalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meta = await getMeta(id);
  const pct = meta.objetivo > 0 ? (meta.aportado / meta.objetivo) * 100 : 0;
  const activa = meta.estado === "ACTIVA";
  const porMes = activa && meta.fechaObjetivo && meta.falta > 0 ? meta.falta / mesesHasta(meta.fechaObjetivo) : null;
  const botonSecundario =
    "flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-medium";

  return (
    <div className="flex flex-col gap-5 pb-6">
      <PageHeader
        title={meta.nombre}
        back={{ href: "/metas", label: "Metas" }}
        subtitle={activa ? undefined : ESTADO[meta.estado]}
        action={
          <Link
            href={`/metas/${meta.id}/editar`}
            aria-label="Editar meta"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-muted"
          >
            <Pencil className="size-5" aria-hidden />
          </Link>
        }
      />

      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <CategoriaIcono nombre={meta.icono} fallback={Target} className="size-6" />
          </span>
          <div>
            <p className="text-2xl font-semibold tracking-tight">{formatSoles(meta.aportado)}</p>
            <p className="text-sm text-muted">de {formatSoles(meta.objetivo)}</p>
          </div>
          <span className="ml-auto text-lg font-semibold">{Math.floor(pct)}%</span>
        </div>
        <ProgressBar value={pct} />
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-surface-muted px-3 py-2">
            <p className="text-xs text-muted">Falta</p>
            <p className="font-semibold">{formatSoles(meta.falta)}</p>
          </div>
          <div className="rounded-xl bg-surface-muted px-3 py-2">
            <p className="text-xs text-muted">Fecha objetivo</p>
            <p className="font-semibold">{meta.fechaObjetivo ? formatFecha(meta.fechaObjetivo) : "Sin fecha"}</p>
          </div>
        </div>
        {porMes !== null && (
          <p className="text-sm text-muted">
            Ahorra <span className="font-semibold text-foreground">{formatSoles(Math.ceil(porMes * 100) / 100)}</span> al mes para llegar a tiempo.
          </p>
        )}
        {meta.notas && <p className="text-sm text-muted">{meta.notas}</p>}
      </Card>

      {activa && meta.falta === 0 && (
        <ConfirmButton
          action={cambiarEstadoMeta.bind(null, meta.id, "COMPLETADA")}
          message={`¿Marcar "${meta.nombre}" como cumplida?`}
          titulo="¿Ya lo compraste?"
          confirmar="Sí, cumplida"
          tono="accent"
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-success-soft font-medium text-success"
        >
          <CircleCheck className="size-5" aria-hidden />
          Ya lo compré / pagué
        </ConfirmButton>
      )}

      {activa && (
        <MovimientoForm
          action={agregarAporte.bind(null, meta.id)}
          titulo="Separar dinero para esta meta"
          boton="Separar dinero"
          ayuda={`Sale de tu dinero libre: tienes ${formatSoles(meta.libre)}.`}
          hoy={hoyISO()}
          montoSugerido={porMes ? Math.ceil(porMes * 100) / 100 : undefined}
        />
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Aportes</h2>
        <Card flush className="divide-y divide-border">
          {meta.aportes.length === 0 && (
            <p className="p-4 text-sm text-muted">
              Aún no hay aportes. También suman los pagos que vinculas a esta meta.
            </p>
          )}
          {meta.aportes.map((a) => (
            <div key={a.id} className="flex items-center gap-3 py-2.5 pr-2 pl-4">
              <div className="min-w-0 flex-1">
                {a.pago ? (
                  <Link href={`/pagos/${a.pago.id}`} className="flex items-center gap-1.5 truncate font-medium text-accent">
                    <Receipt className="size-4 shrink-0" aria-hidden />
                    {a.pago.descripcion}
                  </Link>
                ) : (
                  <p className="truncate font-medium">{a.nota ?? "Aporte"}</p>
                )}
                <p className="text-xs text-muted">{formatFecha(a.fecha)}</p>
              </div>
              <span className="shrink-0 font-medium">{formatSoles(a.monto)}</span>
              {a.pago ? (
                <span className="size-11 shrink-0" />
              ) : (
                <ConfirmButton
                  action={eliminarAporte.bind(null, meta.id, a.id)}
                  titulo="¿Quitar el aporte?"
                  message={`${formatSoles(a.monto)} vuelven a tu dinero libre.`}
                  label="Eliminar aporte"
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-surface-muted hover:text-danger"
                >
                  <Trash2 className="size-[18px]" aria-hidden />
                </ConfirmButton>
              )}
            </div>
          ))}
        </Card>
      </section>

      <div className="grid grid-cols-2 gap-2">
        {activa ? (
          <>
            <ConfirmButton
              action={cambiarEstadoMeta.bind(null, meta.id, "COMPLETADA")}
              message={`¿Marcar "${meta.nombre}" como cumplida?`}
              titulo="Marcar como cumplida"
              confirmar="Sí, cumplida"
              tono="accent"
              className={`${botonSecundario} text-success`}
            >
              <CircleCheck className="size-4" aria-hidden />
              Cumplida
            </ConfirmButton>
            <ConfirmButton
              action={cambiarEstadoMeta.bind(null, meta.id, "CANCELADA")}
              message={`"${meta.nombre}" pasará a canceladas. Lo que separaste se queda en la meta; si quieres recuperarlo, elimina la meta.`}
              titulo="¿Cancelar la meta?"
              confirmar="Sí, cancelar"
              tono="accent"
              className={`${botonSecundario} text-muted`}
            >
              <X className="size-4" aria-hidden />
              Cancelar meta
            </ConfirmButton>
          </>
        ) : (
          <ConfirmButton
            action={cambiarEstadoMeta.bind(null, meta.id, "ACTIVA")}
            message={`"${meta.nombre}" volverá a tus metas activas.`}
            titulo="¿Reactivar la meta?"
            confirmar="Reactivar"
            tono="accent"
            className={`${botonSecundario} col-span-2`}
          >
            <RotateCcw className="size-4" aria-hidden />
            Reactivar meta
          </ConfirmButton>
        )}
      </div>

      <ConfirmButton
        action={eliminarMeta.bind(null, meta.id)}
        message={`Se borra "${meta.nombre}" y sus aportes.${meta.aportes.some((a) => !a.pago) ? " Lo que separaste a mano vuelve a tu dinero libre." : ""} Los pagos vinculados se conservan.`}
        titulo="¿Eliminar la meta?"
        className={`${botonSecundario} text-danger`}
      >
        <Trash2 className="size-4" aria-hidden />
        Eliminar meta
      </ConfirmButton>
    </div>
  );
}

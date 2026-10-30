import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ExternalLink, FileText, Pencil, Trash2 } from "lucide-react";
import { CategoriaIcono } from "@/components/categoria-icono";
import { ConfirmButton } from "@/components/confirm-button";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui";
import { getPago } from "@/lib/data";
import { formatFecha, formatSoles } from "@/lib/format";
import { eliminarPago } from "../actions";

export const metadata: Metadata = { title: "Pago" };

const METODO: Record<string, string> = {
  EFECTIVO: "Efectivo",
  YAPE: "Yape",
  PLIN: "Plin",
  TRANSFERENCIA: "Transferencia",
  TARJETA: "Tarjeta",
  OTRO: "Otro",
};

export default function PagoPage({ params }: PageProps<"/pagos/[id]">) {
  return (
    <Suspense fallback={<div className="mt-12 h-96 animate-pulse rounded-2xl bg-surface-muted" />}>
      <Detalle params={params} />
    </Suspense>
  );
}

async function Detalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pago = await getPago(id);
  const voucherUrl = `/api/vouchers/${pago.id}`;

  return (
    <div className="flex flex-col gap-5 pb-6">
      <PageHeader
        title={pago.descripcion}
        back={{ href: "/pagos", label: "Pagos" }}
        action={
          <Link
            href={`/pagos/${pago.id}/editar`}
            aria-label="Editar pago"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-muted"
          >
            <Pencil className="size-5" aria-hidden />
          </Link>
        }
      />

      <Card className="flex flex-col gap-4">
        <p className="text-[34px] leading-tight font-semibold tracking-tight">{formatSoles(pago.monto)}</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted">Fecha</dt>
          <dd>{formatFecha(pago.fecha)}</dd>
          <dt className="text-muted">Método</dt>
          <dd>{METODO[pago.metodo]}</dd>
          <dt className="text-muted">Categoría</dt>
          <dd className="flex items-center gap-1.5">
            {pago.categoria ? (
              <>
                <CategoriaIcono nombre={pago.categoria.icono} className="size-4 text-muted" />
                {pago.categoria.nombre}
              </>
            ) : (
              "Sin categoría"
            )}
          </dd>
          {pago.meta && (
            <>
              <dt className="text-muted">Meta</dt>
              <dd>Suma a {pago.meta.nombre}</dd>
            </>
          )}
          {pago.deuda && (
            <>
              <dt className="text-muted">Deuda</dt>
              <dd>Abono a {pago.deuda.contraparte}</dd>
            </>
          )}
        </dl>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Voucher</h2>
        {!pago.voucherTipo ? (
          <Card>
            <p className="text-sm text-muted">
              Este pago no tiene voucher.{" "}
              <Link href={`/pagos/${pago.id}/editar`} className="text-accent">
                Agregar uno
              </Link>
            </p>
          </Card>
        ) : pago.voucherTipo.startsWith("image/") ? (
          <a href={voucherUrl} target="_blank" rel="noopener" className="block overflow-hidden rounded-2xl border border-border bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element -- redirige a una URL firmada temporal de S3 */}
            <img src={voucherUrl} alt={`Voucher de ${pago.descripcion}`} className="max-h-[70vh] w-full object-contain" />
          </a>
        ) : (
          <a
            href={voucherUrl}
            target="_blank"
            rel="noopener"
            className="flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-surface px-4"
          >
            <FileText className="size-6 text-muted" aria-hidden />
            <span className="flex-1 font-medium">Ver voucher (PDF)</span>
            <ExternalLink className="size-5 text-muted" aria-hidden />
          </a>
        )}
      </section>

      <ConfirmButton
        action={eliminarPago.bind(null, pago.id)}
        titulo="¿Eliminar el pago?"
        message={`"${pago.descripcion}" de ${formatSoles(pago.monto)}. También se borra su voucher y el monto vuelve a tu dinero libre.`}
        className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-medium text-danger"
      >
        <Trash2 className="size-4" aria-hidden />
        Eliminar pago
      </ConfirmButton>
    </div>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { getOpcionesPago, getPago } from "@/lib/data";
import { isoDesdeFecha } from "@/lib/fechas";
import { guardarPago } from "../../actions";
import { PagoForm } from "../../pago-form";

export const metadata: Metadata = { title: "Editar pago" };

export default function EditarPagoPage({ params }: PageProps<"/pagos/[id]/editar">) {
  return (
    <Suspense fallback={<div className="mt-12 h-[32rem] animate-pulse rounded-2xl bg-surface-muted" />}>
      <Contenido params={params} />
    </Suspense>
  );
}

async function Contenido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [pago, opciones] = await Promise.all([getPago(id), getOpcionesPago()]);

  // Si el pago apunta a una meta ya cerrada, se mantiene como opción para no perder el vínculo.
  if (pago.meta && !opciones.metas.some((m) => m.id === pago.meta!.id)) {
    opciones.metas.push({ id: pago.meta.id, nombre: pago.meta.nombre, falta: 0 });
  }

  return (
    <div className="flex flex-col gap-5 pb-6">
      <PageHeader title="Editar pago" back={{ href: `/pagos/${pago.id}`, label: "Pago" }} />
      <PagoForm
        modo="editar"
        action={guardarPago.bind(null, pago.id)}
        opciones={opciones}
        inicial={{
          monto: pago.monto.toFixed(2),
          descripcion: pago.descripcion,
          fecha: isoDesdeFecha(pago.fecha),
          metodo: pago.metodo,
          categoriaId: pago.categoria?.id ?? "",
          vinculo: pago.meta ? `meta:${pago.meta.id}` : pago.deuda ? `deuda:${pago.deuda.id}` : "",
          voucher: pago.voucherTipo ? { url: `/api/vouchers/${pago.id}`, tipo: pago.voucherTipo } : null,
        }}
      />
    </div>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { getDeuda } from "@/lib/data";
import { isoDesdeFecha } from "@/lib/fechas";
import { guardarDeuda } from "../../actions";
import { DeudaForm } from "../../deuda-form";

export const metadata: Metadata = { title: "Editar deuda" };

export default function EditarDeudaPage({ params }: PageProps<"/deudas/[id]/editar">) {
  return (
    <Suspense fallback={<div className="mt-12 h-96 animate-pulse rounded-2xl bg-surface-muted" />}>
      <Contenido params={params} />
    </Suspense>
  );
}

async function Contenido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deuda = await getDeuda(id);

  return (
    <div className="flex flex-col gap-5 pb-6">
      <PageHeader title="Editar deuda" back={{ href: `/deudas/${deuda.id}`, label: deuda.contraparte }} />
      <DeudaForm
        modo="editar"
        action={guardarDeuda.bind(null, deuda.id)}
        inicial={{
          tipo: deuda.tipo,
          contraparte: deuda.contraparte,
          descripcion: deuda.descripcion ?? "",
          monto: deuda.monto.toFixed(2),
          fecha: isoDesdeFecha(deuda.fecha),
          fechaLimite: deuda.fechaLimite ? isoDesdeFecha(deuda.fechaLimite) : "",
        }}
      />
    </div>
  );
}

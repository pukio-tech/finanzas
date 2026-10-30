import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { getCuota } from "@/lib/data";
import { editarCuota } from "../../actions";
import { CuotaForm } from "../../cuota-form";

export const metadata: Metadata = { title: "Editar cuota" };

export default function EditarCuotaPage({ params }: PageProps<"/cuotas/[id]/editar">) {
  return (
    <Suspense fallback={<div className="mt-12 h-96 animate-pulse rounded-2xl bg-surface-muted" />}>
      <Contenido params={params} />
    </Suspense>
  );
}

async function Contenido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cuota = await getCuota(id);

  return (
    <div className="flex flex-col gap-5 pb-6">
      <PageHeader title="Editar cuota" back={{ href: `/cuotas/${cuota.id}`, label: cuota.concepto }} />
      <p className="-mt-2 text-sm text-muted">
        Para cambiar el monto de un mes, ábrelo en la lista de meses de la cuota.
      </p>
      <CuotaForm
        modo="editar"
        action={editarCuota.bind(null, cuota.id)}
        concepto={cuota.concepto}
        participantesIniciales={cuota.participantes.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          porcentaje: String(p.porcentaje),
          esPropio: p.esPropio,
        }))}
      />
    </div>
  );
}

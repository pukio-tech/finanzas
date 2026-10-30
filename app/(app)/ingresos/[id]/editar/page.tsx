import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { getIngreso } from "@/lib/data";
import { isoDesdeFecha } from "@/lib/fechas";
import { guardarIngreso } from "../../actions";
import { IngresoForm } from "../../ingreso-form";

export const metadata: Metadata = { title: "Editar ingreso" };

export default function EditarIngresoPage({ params }: PageProps<"/ingresos/[id]/editar">) {
  return (
    <Suspense fallback={<div className="mt-12 h-80 animate-pulse rounded-2xl bg-surface-muted" />}>
      <Contenido params={params} />
    </Suspense>
  );
}

async function Contenido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ingreso = await getIngreso(id);

  return (
    <div className="flex flex-col gap-5 pb-6">
      <PageHeader title="Editar ingreso" back={{ href: `/ingresos/${ingreso.id}`, label: ingreso.nombre }} />
      <IngresoForm
        modo="editar"
        action={guardarIngreso.bind(null, ingreso.id)}
        inicial={{
          nombre: ingreso.nombre,
          monto: ingreso.montoMensual.toFixed(2),
          desde: isoDesdeFecha(ingreso.desde).slice(0, 7),
          hasta: ingreso.hasta ? isoDesdeFecha(ingreso.hasta).slice(0, 7) : "",
        }}
      />
    </div>
  );
}

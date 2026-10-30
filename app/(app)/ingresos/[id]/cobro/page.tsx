import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { getIngreso } from "@/lib/data";
import { hoyISO } from "@/lib/fechas";
import { CobroForm } from "./cobro-form";

export const metadata: Metadata = { title: "Registrar cobro" };

export default function CobroPage({ params }: PageProps<"/ingresos/[id]/cobro">) {
  return (
    <Suspense fallback={<div className="mt-12 h-96 animate-pulse rounded-2xl bg-surface-muted" />}>
      <Contenido params={params} />
    </Suspense>
  );
}

async function Contenido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ingreso = await getIngreso(id);
  const actual = ingreso.meses.find((m) => m.actual);

  // Atajos para no escribir el monto a mano.
  const sugerencias = [
    { label: "Lo que te deben", valor: ingreso.porCobrarVencido },
    { label: "Hasta este mes", valor: Math.round((ingreso.porCobrarVencido + ingreso.porCobrarMesActual) * 100) / 100 },
    { label: "Sueldo del mes", valor: actual?.esperado ?? ingreso.montoMensual },
  ].filter((s, i, arr) => s.valor > 0 && arr.findIndex((x) => x.valor === s.valor) === i);

  return (
    <div className="flex flex-col gap-5 pb-6">
      <PageHeader title="Registrar cobro" back={{ href: `/ingresos/${ingreso.id}`, label: ingreso.nombre }} />
      <CobroForm ingresoId={ingreso.id} sugerencias={sugerencias} hoy={hoyISO()} />
    </div>
  );
}

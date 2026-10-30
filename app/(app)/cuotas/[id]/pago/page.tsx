import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { getCuota } from "@/lib/data";
import { hoyISO } from "@/lib/fechas";
import { PagoCuotaForm } from "./pago-form";

export const metadata: Metadata = { title: "Registrar pago" };

export default function PagoCuotaPage({ params }: PageProps<"/cuotas/[id]/pago">) {
  return (
    <Suspense fallback={<div className="mt-12 h-96 animate-pulse rounded-2xl bg-surface-muted" />}>
      <Contenido params={params} />
    </Suspense>
  );
}

async function Contenido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cuota = await getCuota(id);
  const actual = cuota.periodos.find((p) => p.actual);

  const participantes = cuota.participantes.map((p) => {
    const r = cuota.porParticipante.find((x) => x.participanteId === p.id)!;
    return {
      id: p.id,
      nombre: p.nombre,
      esPropio: p.esPropio,
      atrasado: r.faltanteVencido,
      // Lo que debe hasta el mes actual inclusive.
      hastaHoy: Math.round((r.faltanteVencido + r.faltanteMesActual) * 100) / 100,
      cuotaMensual: actual?.participantes.find((e) => e.participanteId === p.id)?.esperado ?? 0,
    };
  });

  return (
    <div className="flex flex-col gap-5 pb-6">
      <PageHeader title="Registrar pago" back={{ href: `/cuotas/${cuota.id}`, label: cuota.concepto }} />
      <PagoCuotaForm cuotaId={cuota.id} participantes={participantes} hoy={hoyISO()} />
    </div>
  );
}

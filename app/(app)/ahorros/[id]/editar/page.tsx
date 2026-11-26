import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { getCuenta } from "@/lib/data";
import { renombrarCuenta } from "../../actions";
import { CuentaForm } from "../../cuenta-form";

export const metadata: Metadata = { title: "Editar cuenta" };

export default function EditarCuentaPage({ params }: PageProps<"/ahorros/[id]/editar">) {
  return (
    <Suspense fallback={<div className="mt-12 h-64 animate-pulse rounded-2xl bg-surface-muted" />}>
      <Contenido params={params} />
    </Suspense>
  );
}

async function Contenido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cuenta = await getCuenta(id);

  return (
    <div className="flex flex-col gap-5 pb-6">
      <PageHeader title="Editar cuenta" back={{ href: `/ahorros/${cuenta.id}`, label: cuenta.nombre }} />
      <CuentaForm modo="editar" action={renombrarCuenta.bind(null, cuenta.id)} nombre={cuenta.nombre} banco={cuenta.banco} />
    </div>
  );
}

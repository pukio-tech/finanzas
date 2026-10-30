import type { Metadata } from "next";
import { Suspense } from "react";
import { io } from "next/cache";
import { PageHeader } from "@/components/page-header";
import { getCurrentUser } from "@/lib/auth";
import { hoyISO } from "@/lib/fechas";
import { crearCuota } from "../actions";
import { CuotaForm } from "../cuota-form";

export const metadata: Metadata = { title: "Nueva cuota" };

export default function NuevaCuotaPage() {
  return (
    <div className="flex flex-col gap-5 pb-6">
      <PageHeader title="Nueva cuota" back={{ href: "/cuotas", label: "Cuotas" }} />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-surface-muted" />}>
        <Formulario />
      </Suspense>
    </div>
  );
}

async function Formulario() {
  const user = await getCurrentUser();
  await io();
  return (
    <CuotaForm
      modo="crear"
      action={crearCuota}
      mesInicial={hoyISO().slice(0, 7)}
      participantesIniciales={[
        { nombre: user.nombre, porcentaje: "50", esPropio: true },
        { nombre: "", porcentaje: "50", esPropio: false },
      ]}
    />
  );
}

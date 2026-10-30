import type { Metadata } from "next";
import { Suspense } from "react";
import { io } from "next/cache";
import { PageHeader } from "@/components/page-header";
import { hoyISO } from "@/lib/fechas";
import { guardarDeuda } from "../actions";
import { DeudaForm } from "../deuda-form";

export const metadata: Metadata = { title: "Nueva deuda" };

export default function NuevaDeudaPage() {
  return (
    <div className="flex flex-col gap-5 pb-6">
      <PageHeader title="Nueva deuda" back={{ href: "/deudas", label: "Deudas" }} />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-surface-muted" />}>
        <Formulario />
      </Suspense>
    </div>
  );
}

async function Formulario() {
  // La fecha por defecto es hoy: se calcula en cada petición.
  await io();
  return (
    <DeudaForm
      modo="crear"
      action={guardarDeuda.bind(null, null)}
      inicial={{ tipo: "DEBO", contraparte: "", descripcion: "", monto: "", fecha: hoyISO(), fechaLimite: "" }}
    />
  );
}

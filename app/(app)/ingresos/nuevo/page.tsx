import type { Metadata } from "next";
import { Suspense } from "react";
import { io } from "next/cache";
import { PageHeader } from "@/components/page-header";
import { hoyISO } from "@/lib/fechas";
import { guardarIngreso } from "../actions";
import { IngresoForm } from "../ingreso-form";

export const metadata: Metadata = { title: "Nuevo ingreso" };

export default function NuevoIngresoPage() {
  return (
    <div className="flex flex-col gap-5 pb-6">
      <PageHeader title="Nuevo ingreso" back={{ href: "/ingresos", label: "Ingresos" }} />
      <Suspense fallback={<div className="h-80 animate-pulse rounded-2xl bg-surface-muted" />}>
        <Formulario />
      </Suspense>
    </div>
  );
}

async function Formulario() {
  // El mes inicial por defecto es el actual: se calcula en cada petición.
  await io();
  return (
    <IngresoForm
      modo="crear"
      action={guardarIngreso.bind(null, null)}
      inicial={{ nombre: "Sueldo del trabajo", monto: "", desde: hoyISO().slice(0, 7), hasta: "" }}
    />
  );
}

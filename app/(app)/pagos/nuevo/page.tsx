import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { getOpcionesPago } from "@/lib/data";
import { hoyISO } from "@/lib/fechas";
import { guardarPago } from "../actions";
import { PagoForm } from "../pago-form";

export const metadata: Metadata = { title: "Registrar pago" };

export default function NuevoPagoPage() {
  return (
    <div className="flex flex-col gap-5 pb-6">
      <PageHeader title="Registrar pago" back={{ href: "/pagos", label: "Pagos" }} />
      <Suspense fallback={<div className="h-[32rem] animate-pulse rounded-2xl bg-surface-muted" />}>
        <Formulario />
      </Suspense>
    </div>
  );
}

async function Formulario() {
  const opciones = await getOpcionesPago();
  return (
    <PagoForm
      modo="crear"
      action={guardarPago.bind(null, null)}
      opciones={opciones}
      inicial={{
        monto: "",
        descripcion: "",
        fecha: hoyISO(),
        metodo: "EFECTIVO",
        categoriaId: "",
        vinculo: "",
        voucher: null,
      }}
    />
  );
}

import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { crearCuenta } from "../actions";
import { CuentaForm } from "../cuenta-form";

export const metadata: Metadata = { title: "Nueva cuenta de ahorro" };

export default function NuevaCuentaPage() {
  return (
    <div className="flex flex-col gap-5 pb-6">
      <PageHeader
        title="Nueva cuenta"
        back={{ href: "/ahorros", label: "Ahorros" }}
        subtitle="Para plata que juntas aparte y llega cuando llega"
      />
      <CuentaForm modo="crear" action={crearCuenta} />
    </div>
  );
}

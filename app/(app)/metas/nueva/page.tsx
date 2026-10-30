import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { guardarMeta } from "../actions";
import { MetaForm } from "../meta-form";

export const metadata: Metadata = { title: "Nueva meta" };

export default function NuevaMetaPage() {
  return (
    <div className="flex flex-col gap-5 pb-6">
      <PageHeader title="Nueva meta" back={{ href: "/metas", label: "Metas" }} />
      <MetaForm
        modo="crear"
        action={guardarMeta.bind(null, null)}
        inicial={{ nombre: "", monto: "", prioridad: "2", fechaObjetivo: "", icono: "target", notas: "" }}
      />
    </div>
  );
}

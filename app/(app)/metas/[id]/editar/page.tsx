import type { Metadata } from "next";
import { Suspense } from "react";
import { ICONOS_META } from "@/components/categoria-icono";
import { PageHeader } from "@/components/page-header";
import { getMeta } from "@/lib/data";
import { isoDesdeFecha } from "@/lib/fechas";
import { guardarMeta } from "../../actions";
import { MetaForm } from "../../meta-form";

export const metadata: Metadata = { title: "Editar meta" };

export default function EditarMetaPage({ params }: PageProps<"/metas/[id]/editar">) {
  return (
    <Suspense fallback={<div className="mt-12 h-96 animate-pulse rounded-2xl bg-surface-muted" />}>
      <Contenido params={params} />
    </Suspense>
  );
}

async function Contenido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meta = await getMeta(id);

  return (
    <div className="flex flex-col gap-5 pb-6">
      <PageHeader title="Editar meta" back={{ href: `/metas/${meta.id}`, label: meta.nombre }} />
      <MetaForm
        modo="editar"
        action={guardarMeta.bind(null, meta.id)}
        inicial={{
          nombre: meta.nombre,
          monto: meta.objetivo.toFixed(2),
          prioridad: String(Math.min(3, Math.max(1, meta.prioridad))),
          fechaObjetivo: meta.fechaObjetivo ? isoDesdeFecha(meta.fechaObjetivo) : "",
          icono: meta.icono && ICONOS_META.includes(meta.icono) ? meta.icono : "target",
          notas: meta.notas ?? "",
        }}
      />
    </div>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { getConfigInicio } from "@/lib/data";
import { EditorInicio } from "./editor";

export const metadata: Metadata = { title: "Personalizar inicio" };

export default function PersonalizarPage() {
  return (
    <div className="flex flex-col gap-5 pb-6">
      <PageHeader
        title="Personalizar inicio"
        back={{ href: "/", label: "Inicio" }}
        subtitle="Elige qué tarjetas ver, en qué orden y cómo"
      />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-surface-muted" />}>
        <Editor />
      </Suspense>
    </div>
  );
}

async function Editor() {
  const config = await getConfigInicio();
  // La key reinicia el editor cuando cambia lo guardado (por ejemplo, al restablecer).
  return <EditorInicio key={JSON.stringify(config)} inicial={config} />;
}

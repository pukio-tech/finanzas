import type { Metadata } from "next";
import { Suspense } from "react";
import { io } from "next/cache";
import Link from "next/link";
import { LinkIcon } from "lucide-react";
import { Card } from "@/components/ui";
import { tokenVigente } from "@/lib/recuperacion";
import { RestablecerForm } from "./restablecer-form";

export const metadata: Metadata = { title: "Nueva contraseña" };

export default function RestablecerPage({ searchParams }: PageProps<"/restablecer">) {
  return (
    <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-surface-muted" />}>
      <Contenido searchParams={searchParams} />
    </Suspense>
  );
}

async function Contenido({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { token } = await searchParams;
  const valor = typeof token === "string" ? token : "";
  // La vigencia depende de la hora actual: se revisa en cada petición.
  await io();
  const vigente = await tokenVigente(valor);

  if (!vigente) {
    return (
      <Card flush className="flex flex-col items-center gap-3 p-5 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-warning-soft text-warning">
          <LinkIcon className="size-6" aria-hidden />
        </span>
        <p className="font-medium">Este enlace ya no sirve</p>
        <p className="text-sm text-muted">Venció o ya se usó. Pide uno nuevo y revisa tu correo.</p>
        <Link
          href="/recuperar"
          className="mt-2 flex min-h-11 items-center rounded-[10px] bg-accent px-4 font-medium text-accent-foreground"
        >
          Pedir otro enlace
        </Link>
      </Card>
    );
  }

  return <RestablecerForm token={valor} />;
}

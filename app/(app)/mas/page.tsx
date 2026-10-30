import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ChartLine, ChevronRight, HandCoins, LogOut, Receipt } from "lucide-react";
import { Card } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { cerrarSesion } from "../../(auth)/actions";

export const metadata: Metadata = { title: "Más" };

const LINKS = [
  { href: "/pagos", label: "Pagos realizados", icon: Receipt },
  { href: "/deudas", label: "Deudas", icon: HandCoins },
  { href: "/proyeccion", label: "Proyección", icon: ChartLine },
];

export default function MasPage() {
  return (
    <div className="flex flex-col gap-4 pt-2 pb-6">
      <h1 className="text-2xl font-semibold tracking-tight">Más</h1>

      <Suspense fallback={<div className="h-16 animate-pulse rounded-2xl bg-surface-muted" />}>
        <Perfil />
      </Suspense>

      <Card flush className="divide-y divide-border">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex min-h-14 items-center gap-3 px-4 active:bg-surface-muted">
            <Icon className="size-5 text-muted" aria-hidden />
            <span className="flex-1">{label}</span>
            <ChevronRight className="size-5 text-muted" aria-hidden />
          </Link>
        ))}
      </Card>

      <form action={cerrarSesion}>
        <button
          type="submit"
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface font-medium text-danger"
        >
          <LogOut className="size-5" aria-hidden />
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}

async function Perfil() {
  const user = await getCurrentUser();
  return (
    <Card className="flex items-center gap-3">
      <span className="flex size-11 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent">
        {user.nombre.charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0">
        <p className="truncate font-medium">{user.nombre}</p>
        <p className="truncate text-sm text-muted">{user.email}</p>
      </div>
    </Card>
  );
}

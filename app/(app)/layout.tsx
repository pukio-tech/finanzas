import type { ReactNode } from "react";
import { Suspense } from "react";
import Link from "next/link";
import { LogOut, Plus, Wallet } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { cerrarSesion } from "../(auth)/actions";
import { BottomNav, SideNav } from "./nav";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 border-r border-border bg-surface p-4 md:flex">
        <Link href="/" className="flex items-center gap-2 px-2 text-lg font-semibold">
          <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Wallet className="size-5" aria-hidden />
          </span>
          Finanzas
        </Link>
        <Link
          href="/pagos/nuevo"
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-[15px] font-medium text-accent-foreground"
        >
          <Plus className="size-5" aria-hidden />
          Registrar pago
        </Link>
        <SideNav />
        <div className="mt-auto border-t border-border pt-4">
          <Suspense fallback={<div className="h-10" />}>
            <UserMenu />
          </Suspense>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-[max(1rem,env(safe-area-inset-top))] md:px-8 md:pt-8">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

async function UserMenu() {
  const user = await getCurrentUser();
  return (
    <div className="flex items-center gap-2 px-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{user.nombre}</p>
        <p className="truncate text-xs text-muted">{user.email}</p>
      </div>
      <form action={cerrarSesion}>
        <button
          type="submit"
          aria-label="Cerrar sesión"
          className="flex size-10 items-center justify-center rounded-xl text-muted hover:bg-surface-muted hover:text-foreground"
        >
          <LogOut className="size-5" aria-hidden />
        </button>
      </form>
    </div>
  );
}

import type { ReactNode } from "react";
import { Wallet } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <Wallet className="size-7" aria-hidden />
          </span>
          <h1 className="text-2xl font-medium tracking-tight">Finanzas</h1>
          <p className="text-sm text-muted">Tu sueldo, lo que te deben y lo que ahorras para tus metas</p>
        </div>
        {children}
      </div>
    </main>
  );
}

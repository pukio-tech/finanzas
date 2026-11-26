import { PiggyBank } from "lucide-react";
import { BANCOS, esBanco, type Banco } from "@/lib/bancos";
import { cx } from "./ui";

// Insignia del banco de una cuenta; sin banco, una alcancía neutra.
export function BancoLogo({ banco, className }: { banco: string | null | undefined; className?: string }) {
  const base = "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[10px]";

  if (!esBanco(banco)) {
    return (
      <span className={cx(base, "bg-surface-muted text-muted", className)} aria-hidden>
        <PiggyBank className="size-4.5" />
      </span>
    );
  }

  const b: Banco = BANCOS[banco];
  if (b.imagen) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- logos locales pequeños
      <img src={b.imagen} alt="" className={cx(base, "bg-white object-contain p-1", className)} />
    );
  }
  const largo = b.sigla.length;
  return (
    <span
      className={cx(base, "font-medium tracking-tight", largo >= 4 ? "text-[10px]" : largo === 3 ? "text-xs" : "text-sm", className)}
      style={{ backgroundColor: b.fondo, color: b.texto }}
      aria-hidden
    >
      {b.sigla}
    </span>
  );
}

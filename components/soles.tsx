import { cx } from "./ui";

const cifra = new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Monto en soles como en un recibo: "S/" pequeño y gris, cifras de ancho fijo.
// Es el detalle propio de la app: se usa en todos los montos que se muestran solos.
export function Soles({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cx("whitespace-nowrap tabular-nums", className)}>
      <span className="mr-[0.2em] align-[0.08em] text-[0.68em] font-normal text-muted">S/</span>
      {value < 0 && "−"}
      {cifra.format(Math.abs(value))}
    </span>
  );
}

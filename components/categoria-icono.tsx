import {
  Bus,
  GraduationCap,
  Laptop,
  Receipt,
  ShoppingCart,
  Tag,
  Utensils,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

// Nombres guardados en BD (lib/categorias.ts y metas) → componente de icono.
const ICONOS: Record<string, LucideIcon> = {
  "graduation-cap": GraduationCap,
  "shopping-cart": ShoppingCart,
  receipt: Receipt,
  utensils: Utensils,
  bus: Bus,
  laptop: Laptop,
  tag: Tag,
};

export function CategoriaIcono({ nombre, ...props }: { nombre?: string | null } & LucideProps) {
  const Icono = (nombre && ICONOS[nombre]) || Receipt;
  return <Icono aria-hidden {...props} />;
}

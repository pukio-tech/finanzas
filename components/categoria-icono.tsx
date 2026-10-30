import {
  Bus,
  Car,
  Gift,
  GraduationCap,
  Heart,
  House,
  Laptop,
  PiggyBank,
  Plane,
  Receipt,
  ShoppingCart,
  Smartphone,
  Tag,
  Target,
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
  smartphone: Smartphone,
  car: Car,
  house: House,
  plane: Plane,
  gift: Gift,
  heart: Heart,
  "piggy-bank": PiggyBank,
  target: Target,
  tag: Tag,
};

// Iconos que se ofrecen al crear una meta.
export const ICONOS_META = [
  "target",
  "graduation-cap",
  "laptop",
  "smartphone",
  "car",
  "house",
  "plane",
  "gift",
  "heart",
  "piggy-bank",
];

export function CategoriaIcono({
  nombre,
  fallback = Receipt,
  ...props
}: { nombre?: string | null; fallback?: LucideIcon } & LucideProps) {
  const Icono = (nombre && ICONOS[nombre]) || fallback;
  return <Icono aria-hidden {...props} />;
}

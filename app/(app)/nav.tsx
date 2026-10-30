"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Banknote,
  ChartLine,
  HandCoins,
  House,
  Menu,
  Plus,
  Receipt,
  Target,
  type LucideIcon,
} from "lucide-react";
import { cx } from "@/components/ui";

type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Inicio", icon: House },
  { href: "/ingresos", label: "Ingresos", icon: Banknote },
  { href: "/pagos", label: "Pagos", icon: Receipt },
  { href: "/metas", label: "Metas", icon: Target },
  { href: "/deudas", label: "Deudas", icon: HandCoins },
  { href: "/proyeccion", label: "Proyección", icon: ChartLine },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

// usePathname() se lee dentro de <Suspense> (ver layout); el fallback se dibuja sin item activo.
export function SideNav() {
  return <SideNavView pathname={usePathname()} />;
}

export function SideNavFallback() {
  return <SideNavView pathname="" />;
}

// Menú lateral para pantallas medianas y grandes.
function SideNavView({ pathname }: { pathname: string }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Principal">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cx(
            "flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] transition",
            isActive(pathname, href)
              ? "bg-accent-soft font-medium text-accent"
              : "text-muted hover:bg-surface-muted hover:text-foreground",
          )}
        >
          <Icon className="size-5" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );
}

const BOTTOM_ITEMS: NavItem[] = [
  { href: "/", label: "Inicio", icon: House },
  { href: "/ingresos", label: "Ingresos", icon: Banknote },
  { href: "/metas", label: "Metas", icon: Target },
  { href: "/mas", label: "Más", icon: Menu },
];

export function BottomNav() {
  return <BottomNavView pathname={usePathname()} />;
}

export function BottomNavFallback() {
  return <BottomNavView pathname="" />;
}

// Barra inferior para celular, con el botón central de registrar pago.
function BottomNavView({ pathname }: { pathname: string }) {
  const items = BOTTOM_ITEMS.map(({ href, label, icon: Icon }) => {
    const active =
      href === "/mas"
        ? ["/mas", "/pagos", "/deudas", "/proyeccion"].some((p) => pathname.startsWith(p)) &&
          pathname !== "/pagos/nuevo"
        : isActive(pathname, href);
    return (
      <Link
        key={href}
        href={href}
        className={cx(
          "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px]",
          active ? "font-medium text-accent" : "text-muted",
        )}
        aria-current={active ? "page" : undefined}
      >
        <Icon className="size-[22px]" aria-hidden />
        {label}
      </Link>
    );
  });

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <div className="mx-auto flex max-w-lg items-center px-2">
        {items.slice(0, 2)}
        <div className="flex flex-1 justify-center">
          <Link
            href="/pagos/nuevo"
            aria-label="Registrar pago"
            className="-mt-6 flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/30 transition active:scale-95"
          >
            <Plus className="size-7" aria-hidden />
          </Link>
        </div>
        {items.slice(2)}
      </div>
    </nav>
  );
}

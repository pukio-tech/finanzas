import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function PageHeader({
  title,
  back,
  action,
  subtitle,
}: {
  title: string;
  back?: { href: string; label: string };
  action?: ReactNode;
  subtitle?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-1 pt-1">
      {back && (
        <Link href={back.href} className="-ml-2 flex min-h-11 w-fit items-center gap-0.5 px-2 text-sm text-accent">
          <ChevronLeft className="size-5" aria-hidden />
          {back.label}
        </Link>
      )}
      <div className="flex items-start justify-between gap-3">
        <h1 className="min-w-0 text-2xl font-semibold tracking-tight break-words">{title}</h1>
        {action}
      </div>
      {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
    </header>
  );
}

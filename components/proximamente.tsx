import { Construction } from "lucide-react";
import { Card } from "./ui";

// Marcador para secciones de fases siguientes.
export function Proximamente({ titulo, fase }: { titulo: string; fase: number }) {
  return (
    <div className="flex flex-col gap-4 pt-2">
      <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
      <Card className="flex flex-col items-center gap-2 py-10 text-center">
        <Construction className="size-8 text-muted" aria-hidden />
        <p className="font-medium">En construcción</p>
        <p className="text-sm text-muted">Esta sección llega en la fase {fase}.</p>
      </Card>
    </div>
  );
}

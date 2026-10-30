"use client";

import { useFormAction } from "@/components/use-form-action";
import { Alert, Button, Card, MoneyInput } from "@/components/ui";
import { guardarPlan } from "./actions";

export function PlanForm({ ahorroActual, gastoMensual }: { ahorroActual: number; gastoMensual: number }) {
  const { state, pending, onSubmit } = useFormAction(guardarPlan);

  return (
    <Card>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <p className="font-medium">Tu ahorro</p>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-muted">Tienes ahorrado</span>
            <MoneyInput name="ahorroActual" defaultValue={ahorroActual.toFixed(2)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-muted">Gastas al mes</span>
            <MoneyInput name="gastoMensual" defaultValue={gastoMensual.toFixed(2)} />
          </label>
        </div>
        <p className="text-xs text-muted">
          Lo ahorrado es tu dinero libre, sin lo que ya separaste para metas. Los gastos fijos se restan de tus ingresos cada mes.
        </p>
        {state.error && <Alert>{state.error}</Alert>}
        {state.ok && !pending && <Alert tone="success">Guardado</Alert>}
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar"}
        </Button>
      </form>
    </Card>
  );
}

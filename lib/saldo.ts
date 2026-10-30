import "server-only";
import { db } from "./db";

// "Tienes ahorrado" (PlanAhorro.ahorroActual) es tu dinero libre y se mueve solo:
//   + cobros de tu sueldo, + abonos que te devuelven
//   − pagos realizados, − dinero que separas para metas, − abonos a lo que debes
// Borrar un movimiento lo revierte. Devuelve una consulta para usar dentro de $transaction.
export function moverAhorro(usuarioId: string, delta: number) {
  const monto = Math.round(delta * 100) / 100;
  return db.planAhorro.upsert({
    where: { usuarioId },
    create: { usuarioId, ahorroActual: monto },
    update: { ahorroActual: { increment: monto } },
  });
}

export async function ahorroLibre(usuarioId: string) {
  const plan = await db.planAhorro.findUnique({ where: { usuarioId }, select: { ahorroActual: true } });
  return plan ? plan.ahorroActual.toNumber() : 0;
}

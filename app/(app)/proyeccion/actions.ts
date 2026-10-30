"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { fallo, montoOCeroSchema, primerError, type FormState } from "@/lib/validacion";

const planSchema = z.object({
  ahorroActual: montoOCeroSchema,
  gastoMensual: montoOCeroSchema,
});

export async function guardarPlan(_prev: FormState, formData: FormData): Promise<FormState> {
  const usuarioId = await requireUserId();
  const parsed = planSchema.safeParse({
    ahorroActual: formData.get("ahorroActual"),
    gastoMensual: formData.get("gastoMensual"),
  });
  if (!parsed.success) return fallo(formData, primerError(parsed.error));

  await db.planAhorro.upsert({
    where: { usuarioId },
    create: { usuarioId, ...parsed.data },
    update: parsed.data,
  });

  revalidatePath("/");
  revalidatePath("/proyeccion");
  return { ok: true };
}

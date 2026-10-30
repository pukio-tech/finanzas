"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ICONOS_META } from "@/components/categoria-icono";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { fechaDesdeISO } from "@/lib/fechas";
import { formatSoles } from "@/lib/format";
import { ahorroLibre, moverAhorro } from "@/lib/saldo";
import { fallo, fechaSchema, montoSchema, primerError, textoOpcional, type FormState } from "@/lib/validacion";

async function metaPropia(metaId: string) {
  const usuarioId = await requireUserId();
  const meta = await db.meta.findFirst({ where: { id: metaId, usuarioId }, select: { id: true } });
  if (!meta) throw new Error("Meta no encontrada");
  return { ...meta, usuarioId };
}

function refrescar(metaId?: string) {
  revalidatePath("/");
  revalidatePath("/metas");
  revalidatePath("/pagos/nuevo");
  if (metaId) revalidatePath(`/metas/${metaId}`);
}

const metaSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe el nombre de la meta").max(80),
  monto: montoSchema,
  prioridad: z.coerce.number().int().min(1).max(3),
  fechaObjetivo: z.union([z.literal(""), fechaSchema]).transform((s) => (s ? fechaDesdeISO(s) : null)),
  icono: z.string().refine((s) => ICONOS_META.includes(s), "Icono no válido"),
  notas: textoOpcional,
});

export async function guardarMeta(metaId: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const usuarioId = await requireUserId();
  if (metaId) await metaPropia(metaId);

  const parsed = metaSchema.safeParse({
    nombre: formData.get("nombre") ?? "",
    monto: formData.get("monto"),
    prioridad: formData.get("prioridad"),
    fechaObjetivo: formData.get("fechaObjetivo") ?? "",
    icono: formData.get("icono") ?? "",
    notas: formData.get("notas") ?? "",
  });
  if (!parsed.success) return fallo(formData, primerError(parsed.error));

  const { nombre, monto, prioridad, fechaObjetivo, icono, notas } = parsed.data;
  const data = { nombre, montoObjetivo: monto, prioridad, fechaObjetivo, icono, notas };
  const meta = metaId
    ? await db.meta.update({ where: { id: metaId }, data, select: { id: true } })
    : await db.meta.create({ data: { ...data, usuarioId }, select: { id: true } });

  refrescar(meta.id);
  redirect(`/metas/${meta.id}`);
}

export async function cambiarEstadoMeta(metaId: string, estado: "ACTIVA" | "COMPLETADA" | "CANCELADA") {
  await metaPropia(metaId);
  await db.meta.update({ where: { id: metaId }, data: { estado } });
  refrescar(metaId);
}

export async function eliminarMeta(metaId: string) {
  const { usuarioId } = await metaPropia(metaId);
  // Lo que separaste a mano vuelve a tu dinero libre. Los pagos vinculados se conservan
  // (ya se descontaron como pagos); solo pierden el vínculo.
  const separado = await db.aporteMeta.aggregate({ where: { metaId, pagoId: null }, _sum: { monto: true } });
  await db.$transaction([
    db.meta.delete({ where: { id: metaId } }),
    moverAhorro(usuarioId, separado._sum.monto?.toNumber() ?? 0),
  ]);
  refrescar();
  redirect("/metas");
}

const aporteSchema = z.object({ monto: montoSchema, fecha: fechaSchema, nota: textoOpcional });

export async function agregarAporte(metaId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { usuarioId } = await metaPropia(metaId);
  const parsed = aporteSchema.safeParse({
    monto: formData.get("monto"),
    fecha: formData.get("fecha"),
    nota: formData.get("nota") ?? "",
  });
  if (!parsed.success) return fallo(formData, primerError(parsed.error));

  // El dinero sale de tu ahorro libre, así que no puede ser más de lo que tienes.
  const libre = await ahorroLibre(usuarioId);
  if (parsed.data.monto > libre) {
    return fallo(
      formData,
      libre > 0
        ? `Solo tienes ${formatSoles(libre)} libres. Si tienes más, actualízalo en Proyección.`
        : "No tienes dinero libre. Si tienes ahorros, anótalos en Proyección.",
    );
  }

  await db.$transaction([
    db.aporteMeta.create({
      data: { metaId, monto: parsed.data.monto, fecha: fechaDesdeISO(parsed.data.fecha), nota: parsed.data.nota },
    }),
    moverAhorro(usuarioId, -parsed.data.monto),
  ]);
  refrescar(metaId);
  return { ok: true };
}

export async function eliminarAporte(metaId: string, aporteId: string) {
  const { usuarioId } = await metaPropia(metaId);
  // Los aportes que vienen de un pago se manejan desde el pago.
  const aporte = await db.aporteMeta.findFirst({ where: { id: aporteId, metaId, pagoId: null } });
  if (!aporte) return;
  await db.$transaction([
    db.aporteMeta.delete({ where: { id: aporte.id } }),
    moverAhorro(usuarioId, aporte.monto.toNumber()),
  ]);
  refrescar(metaId);
}

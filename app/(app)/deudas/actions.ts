"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { fechaDesdeISO } from "@/lib/fechas";
import { moverAhorro } from "@/lib/saldo";
import { fallo, fechaSchema, montoSchema, primerError, textoOpcional, type FormState } from "@/lib/validacion";

async function deudaPropia(deudaId: string) {
  const usuarioId = await requireUserId();
  const deuda = await db.deuda.findFirst({ where: { id: deudaId, usuarioId }, select: { id: true, tipo: true } });
  if (!deuda) throw new Error("Deuda no encontrada");
  return { ...deuda, usuarioId };
}

function refrescar(deudaId?: string) {
  revalidatePath("/");
  revalidatePath("/deudas");
  revalidatePath("/pagos/nuevo");
  if (deudaId) revalidatePath(`/deudas/${deudaId}`);
}

const deudaSchema = z
  .object({
    tipo: z.enum(["DEBO", "ME_DEBEN"], { error: "Elige si debes o te deben" }),
    contraparte: z.string().trim().min(1, "Escribe con quién es la deuda").max(80),
    descripcion: textoOpcional,
    monto: montoSchema,
    fecha: fechaSchema,
    fechaLimite: z.union([z.literal(""), fechaSchema]),
  })
  .refine((d) => !d.fechaLimite || d.fechaLimite >= d.fecha, {
    message: "La fecha límite no puede ser antes de la fecha de la deuda",
  });

export async function guardarDeuda(deudaId: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const usuarioId = await requireUserId();
  const actual = deudaId ? await deudaPropia(deudaId) : null;

  const parsed = deudaSchema.safeParse({
    tipo: formData.get("tipo"),
    contraparte: formData.get("contraparte") ?? "",
    descripcion: formData.get("descripcion") ?? "",
    monto: formData.get("monto"),
    fecha: formData.get("fecha"),
    fechaLimite: formData.get("fechaLimite") ?? "",
  });
  if (!parsed.success) return fallo(formData, primerError(parsed.error));

  const { tipo, contraparte, descripcion, monto, fecha, fechaLimite } = parsed.data;
  if (deudaId && actual && actual.tipo !== tipo) {
    // Los abonos ya movieron tu dinero libre en un sentido; cambiar el tipo lo descuadraría.
    const [abonos, aumentos] = await Promise.all([
      db.abonoDeuda.count({ where: { deudaId } }),
      db.aumentoDeuda.count({ where: { deudaId } }),
    ]);
    if (abonos + aumentos > 0) {
      return fallo(formData, "Esta deuda ya tiene movimientos; no puedes cambiar quién le debe a quién.");
    }
  }

  const data = {
    tipo,
    contraparte,
    descripcion,
    monto,
    fecha: fechaDesdeISO(fecha),
    fechaLimite: fechaLimite ? fechaDesdeISO(fechaLimite) : null,
  };
  const deuda = deudaId
    ? await db.deuda.update({ where: { id: deudaId }, data, select: { id: true } })
    : await db.deuda.create({ data: { ...data, usuarioId }, select: { id: true } });

  refrescar(deuda.id);
  redirect(`/deudas/${deuda.id}`);
}

export async function eliminarDeuda(deudaId: string) {
  await deudaPropia(deudaId);
  // Los pagos vinculados se conservan; solo se borran los abonos. El dinero libre no cambia:
  // lo que ya pagaste o te devolvieron sigue igual.
  await db.deuda.delete({ where: { id: deudaId } });
  refrescar();
  redirect("/deudas");
}

const abonoSchema = z.object({ monto: montoSchema, fecha: fechaSchema, nota: textoOpcional });

export async function agregarAbono(deudaId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { usuarioId, tipo } = await deudaPropia(deudaId);
  const parsed = abonoSchema.safeParse({
    monto: formData.get("monto"),
    fecha: formData.get("fecha"),
    nota: formData.get("nota") ?? "",
  });
  if (!parsed.success) return fallo(formData, primerError(parsed.error));

  // Si pagas lo que debes, sale de tu dinero libre; si te devuelven, entra.
  await db.$transaction([
    db.abonoDeuda.create({
      data: { deudaId, monto: parsed.data.monto, fecha: fechaDesdeISO(parsed.data.fecha), nota: parsed.data.nota },
    }),
    moverAhorro(usuarioId, tipo === "DEBO" ? -parsed.data.monto : parsed.data.monto),
  ]);
  refrescar(deudaId);
  return { ok: true };
}

export async function eliminarAbono(deudaId: string, abonoId: string) {
  const { usuarioId, tipo } = await deudaPropia(deudaId);
  // Los abonos que vienen de un pago se manejan desde el pago.
  const abono = await db.abonoDeuda.findFirst({ where: { id: abonoId, deudaId, pagoId: null } });
  if (!abono) return;
  const monto = abono.monto.toNumber();
  await db.$transaction([
    db.abonoDeuda.delete({ where: { id: abono.id } }),
    moverAhorro(usuarioId, tipo === "DEBO" ? monto : -monto),
  ]);
  refrescar(deudaId);
}

// Sumar a la deuda. Si fue plata prestada, mueve tu dinero libre: te prestaron (DEBO, entra)
// o prestaste (ME_DEBEN, sale). Si solo se debe más (un servicio, una compra fiada), no lo toca.
export async function agregarAumento(deudaId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { usuarioId, tipo } = await deudaPropia(deudaId);
  const parsed = abonoSchema.safeParse({
    monto: formData.get("monto"),
    fecha: formData.get("fecha"),
    nota: formData.get("nota") ?? "",
  });
  if (!parsed.success) return fallo(formData, primerError(parsed.error));

  const movioLibre = formData.get("movioLibre") === "on";
  const crear = db.aumentoDeuda.create({
    data: {
      deudaId,
      monto: parsed.data.monto,
      fecha: fechaDesdeISO(parsed.data.fecha),
      nota: parsed.data.nota,
      movioLibre,
    },
  });
  if (movioLibre) await db.$transaction([crear, moverAhorro(usuarioId, tipo === "DEBO" ? parsed.data.monto : -parsed.data.monto)]);
  else await crear;
  refrescar(deudaId);
  return { ok: true };
}

export async function eliminarAumento(deudaId: string, aumentoId: string) {
  const { usuarioId, tipo } = await deudaPropia(deudaId);
  const aumento = await db.aumentoDeuda.findFirst({ where: { id: aumentoId, deudaId } });
  if (!aumento) return;
  const monto = aumento.monto.toNumber();
  const borrar = db.aumentoDeuda.delete({ where: { id: aumento.id } });
  if (aumento.movioLibre) await db.$transaction([borrar, moverAhorro(usuarioId, tipo === "DEBO" ? -monto : monto)]);
  else await borrar;
  refrescar(deudaId);
}

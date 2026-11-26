"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { fechaDesdeISO, indiceMes } from "@/lib/fechas";
import { moverAhorro } from "@/lib/saldo";
import {
  fallo,
  fechaSchema,
  mesSchema,
  montoOCeroSchema,
  montoSchema,
  primerError,
  textoOpcional,
  type FormState,
} from "@/lib/validacion";

async function ingresoPropio(ingresoId: string) {
  const usuarioId = await requireUserId();
  const ingreso = await db.ingreso.findFirst({ where: { id: ingresoId, usuarioId }, select: { id: true, montoMensual: true } });
  if (!ingreso) throw new Error("Ingreso no encontrado");
  return { ...ingreso, usuarioId };
}

function refrescar(ingresoId?: string) {
  revalidatePath("/");
  revalidatePath("/ingresos");
  revalidatePath("/proyeccion");
  if (ingresoId) revalidatePath(`/ingresos/${ingresoId}`);
}

const primerDia = ({ anio, mes }: { anio: number; mes: number }) => new Date(Date.UTC(anio, mes - 1, 1));

const ingresoSchema = z
  .object({
    nombre: z.string().trim().min(2, "Escribe de dónde viene el ingreso").max(80),
    monto: montoSchema,
    desde: mesSchema,
    hasta: z.union([z.literal(""), mesSchema]),
  })
  .refine((d) => !d.hasta || indiceMes(d.hasta) >= indiceMes(d.desde), {
    message: "El mes final no puede ser antes del inicial",
  });

export async function guardarIngreso(ingresoId: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const usuarioId = await requireUserId();
  if (ingresoId) await ingresoPropio(ingresoId);

  const parsed = ingresoSchema.safeParse({
    nombre: formData.get("nombre") ?? "",
    monto: formData.get("monto"),
    desde: formData.get("desde") ?? "",
    hasta: formData.get("hasta") ?? "",
  });
  if (!parsed.success) return fallo(formData, primerError(parsed.error));

  const { nombre, monto, desde, hasta } = parsed.data;
  const data = { nombre, montoMensual: monto, desde: primerDia(desde), hasta: hasta ? primerDia(hasta) : null };
  const ingreso = ingresoId
    ? await db.ingreso.update({ where: { id: ingresoId }, data, select: { id: true } })
    : await db.ingreso.create({ data: { ...data, usuarioId }, select: { id: true } });

  refrescar(ingreso.id);
  redirect(`/ingresos/${ingreso.id}`);
}

// Lo ya cobrado sigue siendo tuyo: borrar el ingreso no toca tu dinero libre.
export async function eliminarIngreso(ingresoId: string) {
  await ingresoPropio(ingresoId);
  await db.ingreso.delete({ where: { id: ingresoId } });
  refrescar();
  redirect("/ingresos");
}

const cobroSchema = z.object({ monto: montoSchema, fecha: fechaSchema, nota: textoOpcional });

export async function registrarCobro(ingresoId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { usuarioId } = await ingresoPropio(ingresoId);
  const parsed = cobroSchema.safeParse({
    monto: formData.get("monto"),
    fecha: formData.get("fecha"),
    nota: formData.get("nota") ?? "",
  });
  if (!parsed.success) return fallo(formData, primerError(parsed.error));

  // Lo que cobras pasa a tu dinero libre.
  await db.$transaction([
    db.cobro.create({
      data: { ingresoId, monto: parsed.data.monto, fecha: fechaDesdeISO(parsed.data.fecha), nota: parsed.data.nota },
    }),
    moverAhorro(usuarioId, parsed.data.monto),
  ]);
  refrescar(ingresoId);
  redirect(`/ingresos/${ingresoId}`);
}

export async function eliminarCobro(ingresoId: string, cobroId: string) {
  const { usuarioId } = await ingresoPropio(ingresoId);
  const cobro = await db.cobro.findFirst({ where: { id: cobroId, ingresoId } });
  if (!cobro) return;
  await db.$transaction([db.cobro.delete({ where: { id: cobro.id } }), moverAhorro(usuarioId, -cobro.monto.toNumber())]);
  refrescar(ingresoId);
}

// Cambia lo que se espera cobrar en un mes concreto (0 = ese mes no hay ingreso).
export async function ajustarMes(
  ingresoId: string,
  anio: number,
  mes: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ingreso = await ingresoPropio(ingresoId);
  const parsed = montoOCeroSchema.safeParse(formData.get("monto"));
  if (!parsed.success) return fallo(formData, primerError(parsed.error));

  const clave = { ingresoId_anio_mes: { ingresoId, anio, mes } };
  if (parsed.data === ingreso.montoMensual.toNumber()) {
    // Igual al monto normal: no hace falta guardar un ajuste.
    await db.ajusteIngreso.deleteMany({ where: { ingresoId, anio, mes } });
  } else {
    await db.ajusteIngreso.upsert({
      where: clave,
      create: { ingresoId, anio, mes, monto: parsed.data },
      update: { monto: parsed.data },
    });
  }
  refrescar(ingresoId);
  return { ok: true };
}

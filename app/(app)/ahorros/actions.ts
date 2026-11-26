"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { fechaDesdeISO, hoyISO } from "@/lib/fechas";
import { moverAhorro } from "@/lib/saldo";
import {
  fallo,
  fechaSchema,
  montoOCeroSchema,
  montoSchema,
  primerError,
  textoOpcional,
  type FormState,
} from "@/lib/validacion";

// Las cuentas de ahorro van aparte: lo que entra o sale de ellas no toca tu dinero libre,
// salvo una salida marcada "pasar a mi dinero libre".

async function cuentaPropia(cuentaId: string) {
  const usuarioId = await requireUserId();
  const cuenta = await db.cuenta.findFirst({ where: { id: cuentaId, usuarioId }, select: { id: true } });
  if (!cuenta) throw new Error("Cuenta no encontrada");
  return { ...cuenta, usuarioId };
}

function refrescar(cuentaId?: string) {
  revalidatePath("/");
  revalidatePath("/ahorros");
  revalidatePath("/proyeccion");
  if (cuentaId) revalidatePath(`/ahorros/${cuentaId}`);
}

const nombreSchema = z.string().trim().min(2, "Escribe un nombre, por ejemplo PEYA").max(80);

export async function crearCuenta(_prev: FormState, formData: FormData): Promise<FormState> {
  const usuarioId = await requireUserId();
  const parsed = z
    .object({ nombre: nombreSchema, saldo: montoOCeroSchema })
    .safeParse({ nombre: formData.get("nombre") ?? "", saldo: formData.get("saldo") });
  if (!parsed.success) return fallo(formData, primerError(parsed.error));

  const { nombre, saldo } = parsed.data;
  const cuenta = await db.cuenta.create({
    data: {
      usuarioId,
      nombre,
      // Lo que ya tenías juntado entra como primer movimiento.
      ...(saldo > 0
        ? {
            movimientos: {
              create: { tipo: "ENTRADA", monto: saldo, fecha: fechaDesdeISO(hoyISO()), nota: "Saldo inicial" },
            },
          }
        : {}),
    },
    select: { id: true },
  });
  refrescar(cuenta.id);
  redirect(`/ahorros/${cuenta.id}`);
}

export async function renombrarCuenta(cuentaId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await cuentaPropia(cuentaId);
  const parsed = nombreSchema.safeParse(formData.get("nombre") ?? "");
  if (!parsed.success) return fallo(formData, primerError(parsed.error));
  await db.cuenta.update({ where: { id: cuentaId }, data: { nombre: parsed.data } });
  refrescar(cuentaId);
  redirect(`/ahorros/${cuentaId}`);
}

// Lo que ya pasaste a tu dinero libre se queda ahí.
export async function eliminarCuenta(cuentaId: string) {
  await cuentaPropia(cuentaId);
  await db.cuenta.delete({ where: { id: cuentaId } });
  refrescar();
  redirect("/ahorros");
}

const movimientoSchema = z.object({ monto: montoSchema, fecha: fechaSchema, nota: textoOpcional });

function leerMovimiento(formData: FormData) {
  return movimientoSchema.safeParse({
    monto: formData.get("monto"),
    fecha: formData.get("fecha"),
    nota: formData.get("nota") ?? "",
  });
}

export async function agregarEntrada(cuentaId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await cuentaPropia(cuentaId);
  const parsed = leerMovimiento(formData);
  if (!parsed.success) return fallo(formData, primerError(parsed.error));
  const { monto, fecha, nota } = parsed.data;
  await db.movimientoCuenta.create({ data: { cuentaId, tipo: "ENTRADA", monto, fecha: fechaDesdeISO(fecha), nota } });
  refrescar(cuentaId);
  return { ok: true };
}

async function saldoCuenta(cuentaId: string) {
  const grupos = await db.movimientoCuenta.groupBy({ by: ["tipo"], where: { cuentaId }, _sum: { monto: true } });
  const total = (tipo: "ENTRADA" | "SALIDA") => grupos.find((g) => g.tipo === tipo)?._sum.monto?.toNumber() ?? 0;
  return Math.round((total("ENTRADA") - total("SALIDA")) * 100) / 100;
}

export async function agregarSalida(cuentaId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { usuarioId } = await cuentaPropia(cuentaId);
  const parsed = leerMovimiento(formData);
  if (!parsed.success) return fallo(formData, primerError(parsed.error));
  const { monto, fecha, nota } = parsed.data;

  const saldo = await saldoCuenta(cuentaId);
  if (monto > saldo) return fallo(formData, `En esta cuenta solo tienes S/ ${saldo.toFixed(2)}`);

  const aLibre = formData.get("aLibre") === "on";
  const crear = db.movimientoCuenta.create({
    data: { cuentaId, tipo: "SALIDA", monto, fecha: fechaDesdeISO(fecha), nota, aLibre },
  });
  if (aLibre) await db.$transaction([crear, moverAhorro(usuarioId, monto)]);
  else await crear;
  refrescar(cuentaId);
  return { ok: true };
}

export async function eliminarMovimiento(cuentaId: string, movimientoId: string) {
  const { usuarioId } = await cuentaPropia(cuentaId);
  const mov = await db.movimientoCuenta.findFirst({ where: { id: movimientoId, cuentaId } });
  if (!mov) return;
  const borrar = db.movimientoCuenta.delete({ where: { id: mov.id } });
  // Si esa salida pasó a tu dinero libre, regresa a la cuenta y sale de tu dinero libre.
  if (mov.aLibre) await db.$transaction([borrar, moverAhorro(usuarioId, -mov.monto.toNumber())]);
  else await borrar;
  refrescar(cuentaId);
}

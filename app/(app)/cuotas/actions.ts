"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { fechaDesdeISO, mesActual, sumarMeses } from "@/lib/fechas";
import {
  fechaSchema,
  mesSchema,
  montoSchema,
  fallo,
  primerError,
  textoOpcional,
  type FormState,
} from "@/lib/validacion";

// Cada acción vuelve a leer la sesión y comprueba que la cuota sea del usuario.
async function cuotaPropia(cuotaId: string) {
  const usuarioId = await requireUserId();
  const cuota = await db.cuota.findFirst({
    where: { id: cuotaId, usuarioId },
    include: { participantes: true, periodos: { orderBy: [{ anio: "desc" }, { mes: "desc" }], take: 1 } },
  });
  if (!cuota) throw new Error("Cuota no encontrada");
  return cuota;
}

function refrescar(cuotaId?: string) {
  revalidatePath("/");
  revalidatePath("/cuotas");
  if (cuotaId) revalidatePath(`/cuotas/${cuotaId}`);
}

const participantesSchema = z
  .array(
    z.object({
      id: z.string().optional(),
      nombre: z.string().trim().min(1, "Escribe el nombre de cada participante").max(60),
      porcentaje: z.coerce
        .number({ error: "Porcentaje no válido" })
        .gt(0, "Cada porcentaje debe ser mayor a 0")
        .max(100, "Un porcentaje no puede pasar de 100"),
    }),
  )
  .min(1, "Agrega al menos un participante")
  .max(10, "Máximo 10 participantes")
  .refine(
    (ps) => Math.abs(ps.reduce((s, p) => s + p.porcentaje, 0) - 100) < 0.01,
    "Los porcentajes deben sumar 100%",
  );

function leerParticipantes(formData: FormData) {
  const ids = formData.getAll("participante_id").map(String);
  const nombres = formData.getAll("participante_nombre").map(String);
  const porcentajes = formData.getAll("participante_porcentaje").map(String);
  return nombres.map((nombre, i) => ({
    id: ids[i] || undefined,
    nombre,
    porcentaje: porcentajes[i]?.replace(",", "."),
  }));
}

const nuevaCuotaSchema = z.object({
  concepto: z.string().trim().min(2, "Escribe un nombre para la cuota").max(80),
  monto: montoSchema,
  desde: mesSchema,
  meses: z.coerce.number().int().min(1, "Mínimo 1 mes").max(60, "Máximo 60 meses"),
  participantes: participantesSchema,
});

export async function crearCuota(_prev: FormState, formData: FormData): Promise<FormState> {
  const usuarioId = await requireUserId();
  const parsed = nuevaCuotaSchema.safeParse({
    concepto: formData.get("concepto"),
    monto: formData.get("monto"),
    desde: formData.get("desde"),
    meses: formData.get("meses"),
    participantes: leerParticipantes(formData),
  });
  if (!parsed.success) return fallo(formData, primerError(parsed.error));

  const { concepto, monto, desde, meses, participantes } = parsed.data;
  const cuota = await db.cuota.create({
    data: {
      usuarioId,
      concepto,
      participantes: {
        // El primero de la lista es el dueño de la cuenta.
        create: participantes.map((p, i) => ({ nombre: p.nombre, porcentaje: p.porcentaje, esPropio: i === 0 })),
      },
      periodos: {
        create: Array.from({ length: meses }, (_, i) => ({ ...sumarMeses(desde, i), monto })),
      },
    },
    select: { id: true },
  });

  refrescar();
  redirect(`/cuotas/${cuota.id}`);
}

const editarCuotaSchema = z.object({
  concepto: z.string().trim().min(2, "Escribe un nombre para la cuota").max(80),
  participantes: participantesSchema,
});

export async function editarCuota(cuotaId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const cuota = await cuotaPropia(cuotaId);
  const parsed = editarCuotaSchema.safeParse({
    concepto: formData.get("concepto"),
    participantes: leerParticipantes(formData),
  });
  if (!parsed.success) return fallo(formData, primerError(parsed.error));

  const { concepto, participantes } = parsed.data;
  const existentes = new Set(cuota.participantes.map((p) => p.id));
  const enviados = new Set(participantes.flatMap((p) => (p.id ? [p.id] : [])));
  if ([...enviados].some((id) => !existentes.has(id))) return fallo(formData, "Participante no válido");

  const quitados = cuota.participantes.filter((p) => !enviados.has(p.id));
  if (quitados.some((p) => p.esPropio)) return fallo(formData, "No puedes quitarte a ti de la cuota");
  if (quitados.length > 0) {
    const conPagos = await db.pagoCuota.count({ where: { participanteId: { in: quitados.map((p) => p.id) } } });
    if (conPagos > 0) return fallo(formData, "No puedes quitar a alguien que ya tiene pagos registrados");
  }

  await db.$transaction([
    db.cuota.update({ where: { id: cuotaId }, data: { concepto } }),
    db.participanteCuota.deleteMany({ where: { id: { in: quitados.map((p) => p.id) } } }),
    ...participantes.map((p) =>
      p.id
        ? db.participanteCuota.update({ where: { id: p.id }, data: { nombre: p.nombre, porcentaje: p.porcentaje } })
        : db.participanteCuota.create({ data: { cuotaId, nombre: p.nombre, porcentaje: p.porcentaje } }),
    ),
  ]);

  refrescar(cuotaId);
  redirect(`/cuotas/${cuotaId}`);
}

export async function eliminarCuota(cuotaId: string) {
  await cuotaPropia(cuotaId);
  await db.cuota.delete({ where: { id: cuotaId } });
  refrescar();
  redirect("/cuotas");
}

const pagoSchema = z.object({
  participanteId: z.string().min(1, "Elige quién pagó"),
  monto: montoSchema,
  fecha: fechaSchema,
  nota: textoOpcional,
});

export async function registrarPagoCuota(cuotaId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const cuota = await cuotaPropia(cuotaId);
  const parsed = pagoSchema.safeParse({
    participanteId: formData.get("participanteId") ?? "",
    monto: formData.get("monto"),
    fecha: formData.get("fecha"),
    nota: formData.get("nota") ?? "",
  });
  if (!parsed.success) return fallo(formData, primerError(parsed.error));

  const { participanteId, monto, fecha, nota } = parsed.data;
  if (!cuota.participantes.some((p) => p.id === participanteId)) return fallo(formData, "Participante no válido");

  await db.pagoCuota.create({
    data: { cuotaId, participanteId, monto, fecha: fechaDesdeISO(fecha), nota },
  });

  refrescar(cuotaId);
  redirect(`/cuotas/${cuotaId}`);
}

export async function eliminarPagoCuota(cuotaId: string, pagoId: string) {
  await cuotaPropia(cuotaId);
  await db.pagoCuota.deleteMany({ where: { id: pagoId, cuotaId } });
  refrescar(cuotaId);
}

export async function actualizarMontoMes(cuotaId: string, periodoId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await cuotaPropia(cuotaId);
  const parsed = montoSchema.safeParse(formData.get("monto"));
  if (!parsed.success) return fallo(formData, primerError(parsed.error));

  await db.periodoCuota.updateMany({ where: { id: periodoId, cuotaId }, data: { monto: parsed.data } });
  refrescar(cuotaId);
  return { ok: true };
}

export async function eliminarMes(cuotaId: string, periodoId: string) {
  await cuotaPropia(cuotaId);
  await db.periodoCuota.deleteMany({ where: { id: periodoId, cuotaId } });
  refrescar(cuotaId);
}

const agregarMesesSchema = z.object({
  meses: z.coerce.number().int().min(1, "Mínimo 1 mes").max(36, "Máximo 36 meses a la vez"),
  monto: montoSchema,
});

export async function agregarMeses(cuotaId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const cuota = await cuotaPropia(cuotaId);
  const parsed = agregarMesesSchema.safeParse({ meses: formData.get("meses"), monto: formData.get("monto") });
  if (!parsed.success) return fallo(formData, primerError(parsed.error));

  // Continúa después del último mes; si no hay meses, empieza en el actual.
  const ultimo = cuota.periodos[0];
  const desde = ultimo ? sumarMeses(ultimo, 1) : mesActual();

  await db.periodoCuota.createMany({
    data: Array.from({ length: parsed.data.meses }, (_, i) => ({ cuotaId, ...sumarMeses(desde, i), monto: parsed.data.monto })),
    skipDuplicates: true,
  });

  refrescar(cuotaId);
  return { ok: true };
}

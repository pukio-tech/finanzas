"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { fechaDesdeISO } from "@/lib/fechas";
import { moverAhorro } from "@/lib/saldo";
import { borrarVoucher, subirVoucher, VOUCHER_MAX_BYTES, VOUCHER_TIPOS } from "@/lib/s3";
import { fallo, fechaSchema, montoSchema, primerError, type FormState } from "@/lib/validacion";

const METODOS = ["EFECTIVO", "YAPE", "PLIN", "TRANSFERENCIA", "TARJETA", "OTRO"] as const;

const pagoSchema = z.object({
  monto: montoSchema,
  descripcion: z.string().trim().min(2, "Describe el pago").max(120, "Máximo 120 caracteres"),
  fecha: fechaSchema,
  metodo: z.enum(METODOS, { error: "Elige un método de pago" }),
  categoriaId: z.string().transform((s) => s || null),
  // "", "meta:<id>" o "deuda:<id>"
  vinculo: z.string().regex(/^((meta|deuda):[\w-]+)?$/, "Vínculo no válido"),
});

function refrescar(pagoId?: string) {
  revalidatePath("/");
  revalidatePath("/pagos");
  revalidatePath("/metas");
  revalidatePath("/deudas");
  if (pagoId) revalidatePath(`/pagos/${pagoId}`);
}

function leerVoucher(formData: FormData): File | null | string {
  const file = formData.get("voucher");
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > VOUCHER_MAX_BYTES) return "El voucher no puede pesar más de 5 MB";
  if (!VOUCHER_TIPOS.includes(file.type)) return "El voucher debe ser una imagen o un PDF";
  return file;
}

// Comprueba que la categoría, la meta y la deuda elegidas sean del usuario.
async function validarReferencias(usuarioId: string, categoriaId: string | null, vinculo: string) {
  if (categoriaId) {
    const ok = await db.categoria.count({ where: { id: categoriaId, usuarioId } });
    if (!ok) return "Categoría no válida";
  }
  const [tipo, id] = vinculo.split(":");
  if (tipo === "meta") {
    const ok = await db.meta.count({ where: { id, usuarioId } });
    if (!ok) return "Meta no válida";
  }
  if (tipo === "deuda") {
    const ok = await db.deuda.count({ where: { id, usuarioId, tipo: "DEBO" } });
    if (!ok) return "Deuda no válida";
  }
  return null;
}

export async function guardarPago(pagoId: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const usuarioId = await requireUserId();
  const parsed = pagoSchema.safeParse({
    monto: formData.get("monto"),
    descripcion: formData.get("descripcion") ?? "",
    fecha: formData.get("fecha"),
    metodo: formData.get("metodo"),
    categoriaId: formData.get("categoriaId") ?? "",
    vinculo: formData.get("vinculo") ?? "",
  });
  if (!parsed.success) return fallo(formData, primerError(parsed.error));
  const { monto, descripcion, fecha, metodo, categoriaId, vinculo } = parsed.data;

  const existente = pagoId
    ? await db.pago.findFirst({ where: { id: pagoId, usuarioId }, select: { id: true, voucherKey: true, monto: true } })
    : null;
  if (pagoId && !existente) return fallo(formData, "Pago no encontrado");

  const errorRef = await validarReferencias(usuarioId, categoriaId, vinculo);
  if (errorRef) return fallo(formData, errorRef);

  const voucher = leerVoucher(formData);
  if (typeof voucher === "string") return fallo(formData, voucher);
  const quitarVoucher = formData.get("quitarVoucher") === "1";

  let nuevaKey: string | null = null;
  if (voucher) {
    try {
      nuevaKey = await subirVoucher(usuarioId, voucher);
    } catch (error) {
      console.error(error);
      return fallo(formData, "No se pudo subir el voucher. Revisa la configuración de S3 e inténtalo de nuevo.");
    }
  }

  const fechaDate = fechaDesdeISO(fecha);
  const [tipo, refId] = vinculo.split(":");
  const vinculoData = {
    aporte: tipo === "meta" ? { create: { metaId: refId, fecha: fechaDate, monto } } : undefined,
    abono: tipo === "deuda" ? { create: { deudaId: refId, fecha: fechaDate, monto } } : undefined,
  };
  const voucherData = nuevaKey
    ? { voucherKey: nuevaKey, voucherTipo: voucher!.type }
    : quitarVoucher
      ? { voucherKey: null, voucherTipo: null }
      : {};

  let id: string;
  try {
    if (existente) {
      // El vínculo se rehace en cada edición para que el aporte/abono copie el monto y la fecha nuevos.
      // Tu dinero libre solo cambia por la diferencia de monto.
      await db.$transaction([
        moverAhorro(usuarioId, existente.monto.toNumber() - monto),
        db.aporteMeta.deleteMany({ where: { pagoId: existente.id } }),
        db.abonoDeuda.deleteMany({ where: { pagoId: existente.id } }),
        db.pago.update({
          where: { id: existente.id },
          data: { monto, descripcion, fecha: fechaDate, metodo, categoriaId, ...voucherData, ...vinculoData },
        }),
      ]);
      id = existente.id;
    } else {
      // Todo pago sale de tu dinero libre (también si suma a una meta o abona una deuda).
      const [creado] = await db.$transaction([
        db.pago.create({
          data: { usuarioId, monto, descripcion, fecha: fechaDate, metodo, categoriaId, ...voucherData, ...vinculoData },
          select: { id: true },
        }),
        moverAhorro(usuarioId, -monto),
      ]);
      id = creado.id;
    }
  } catch (error) {
    console.error(error);
    if (nuevaKey) await borrarVoucher(nuevaKey).catch(() => {});
    return fallo(formData, "No se pudo guardar el pago. Inténtalo de nuevo.");
  }

  // El voucher anterior se borra solo cuando el pago ya quedó guardado.
  if (existente?.voucherKey && (nuevaKey || quitarVoucher)) {
    await borrarVoucher(existente.voucherKey).catch((error) => console.error(error));
  }

  refrescar(id);
  redirect(pagoId ? `/pagos/${id}` : "/pagos");
}

export async function eliminarPago(pagoId: string) {
  const usuarioId = await requireUserId();
  const pago = await db.pago.findFirst({ where: { id: pagoId, usuarioId }, select: { id: true, voucherKey: true, monto: true } });
  if (!pago) return;

  // Borrar el pago devuelve su monto a tu dinero libre.
  await db.$transaction([db.pago.delete({ where: { id: pago.id } }), moverAhorro(usuarioId, pago.monto.toNumber())]);
  if (pago.voucherKey) await borrarVoucher(pago.voucherKey).catch((error) => console.error(error));

  refrescar();
  redirect("/pagos");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { CONFIG_INICIO_DEFECTO, normalizarConfigInicio } from "@/lib/inicio";

export async function guardarConfigInicio(json: string) {
  const usuarioId = await requireUserId();
  let valor: unknown = null;
  try {
    valor = JSON.parse(json);
  } catch {
    valor = null;
  }
  // Se guarda ya normalizada: solo tarjetas y opciones conocidas.
  const config = normalizarConfigInicio(valor);
  await db.usuario.update({ where: { id: usuarioId }, data: { configInicio: config } });
  revalidatePath("/");
  redirect("/");
}

export async function restablecerConfigInicio() {
  const usuarioId = await requireUserId();
  await db.usuario.update({ where: { id: usuarioId }, data: { configInicio: CONFIG_INICIO_DEFECTO } });
  revalidatePath("/");
  revalidatePath("/personalizar");
}

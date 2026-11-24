"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { correoRecuperacion, enviarCorreo, urlApp } from "@/lib/correo";
import { db } from "@/lib/db";
import { MAX_POR_HORA, nuevoToken, tokenVigente } from "@/lib/recuperacion";
import { createSession } from "@/lib/session";

export type RecuperacionState = {
  error?: string;
  enviado?: boolean;
  email?: string;
};

const emailSchema = z.email("Escribe un correo válido").trim().toLowerCase();

// Siempre responde lo mismo exista o no la cuenta, para no revelar qué correos están registrados.
export async function solicitarRecuperacion(_prev: RecuperacionState, formData: FormData): Promise<RecuperacionState> {
  const parsed = emailSchema.safeParse(String(formData.get("email") ?? ""));
  if (!parsed.success) return { error: parsed.error.issues[0].message, email: String(formData.get("email") ?? "") };
  const email = parsed.data;

  const usuario = await db.usuario.findUnique({ where: { email }, select: { id: true, nombre: true, email: true } });
  if (usuario) {
    const recientes = await db.tokenRecuperacion.count({
      where: { usuarioId: usuario.id, creadoEn: { gt: new Date(Date.now() - 60 * 60_000) } },
    });
    if (recientes < MAX_POR_HORA) {
      const { token, tokenHash, expira } = nuevoToken();
      await db.tokenRecuperacion.create({ data: { usuarioId: usuario.id, tokenHash, expira } });
      const enlace = `${urlApp()}/restablecer?token=${token}`;
      const correo = correoRecuperacion(usuario.nombre, enlace);
      try {
        await enviarCorreo({ para: usuario.email, asunto: correo.asunto, texto: correo.texto, html: correo.html });
      } catch (error) {
        console.error("No se pudo enviar el correo de recuperación", error);
        await db.tokenRecuperacion.deleteMany({ where: { tokenHash } });
        return { error: "No pudimos enviar el correo. Inténtalo de nuevo en unos minutos.", email };
      }
    }
  }

  return { enviado: true, email };
}

const nuevaSchema = z
  .object({
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(200),
    confirmar: z.string(),
  })
  .refine((d) => d.password === d.confirmar, { message: "Las contraseñas no coinciden" });

export async function restablecerContrasena(
  token: string,
  _prev: RecuperacionState,
  formData: FormData,
): Promise<RecuperacionState> {
  const parsed = nuevaSchema.safeParse({
    password: String(formData.get("password") ?? ""),
    confirmar: String(formData.get("confirmar") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const vigente = await tokenVigente(token);
  if (!vigente) return { error: "El enlace venció o ya se usó. Pide uno nuevo." };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await db.$transaction([
    db.usuario.update({ where: { id: vigente.usuarioId }, data: { passwordHash } }),
    db.tokenRecuperacion.update({ where: { id: vigente.id }, data: { usadoEn: new Date() } }),
    // Los demás enlaces pendientes de esta cuenta dejan de servir.
    db.tokenRecuperacion.deleteMany({ where: { usuarioId: vigente.usuarioId, usadoEn: null } }),
  ]);

  await createSession(vigente.usuarioId);
  redirect("/");
}

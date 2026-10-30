"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";
import { CATEGORIAS_POR_DEFECTO } from "@/lib/categorias";

export type AuthState = {
  error?: string;
  fields?: Record<string, string>;
};

const registroSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre"),
  email: z.email("Correo no válido").trim().toLowerCase(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export async function registrar(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const raw = {
    nombre: String(formData.get("nombre") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const parsed = registroSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, fields: { nombre: raw.nombre, email: raw.email } };
  }

  const { nombre, email, password } = parsed.data;
  const existe = await db.usuario.findUnique({ where: { email }, select: { id: true } });
  if (existe) {
    return { error: "Ese correo ya tiene una cuenta. Inicia sesión.", fields: { nombre, email } };
  }

  const usuario = await db.usuario.create({
    data: {
      nombre,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      plan: { create: {} },
      categorias: { create: CATEGORIAS_POR_DEFECTO },
    },
    select: { id: true },
  });

  await createSession(usuario.id);
  redirect("/");
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Escribe tu correo"),
  password: z.string().min(1, "Escribe tu contraseña"),
});

export async function iniciarSesion(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, fields: { email: raw.email } };
  }

  const usuario = await db.usuario.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, passwordHash: true },
  });
  const valido = usuario && (await bcrypt.compare(parsed.data.password, usuario.passwordHash));
  if (!valido) {
    return { error: "Correo o contraseña incorrectos", fields: { email: raw.email } };
  }

  await createSession(usuario.id);
  redirect("/");
}

export async function cerrarSesion() {
  await deleteSession();
  redirect("/login");
}

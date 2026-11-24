import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";

export const MINUTOS_VALIDEZ = 30;
// Como máximo tantos correos de recuperación por cuenta en una hora.
export const MAX_POR_HORA = 3;

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export function nuevoToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token), expira: new Date(Date.now() + MINUTOS_VALIDEZ * 60_000) };
}

// Devuelve el token vigente (sin usar y sin vencer) o null.
export async function tokenVigente(token: string) {
  if (!token || token.length > 200) return null;
  return db.tokenRecuperacion.findFirst({
    where: { tokenHash: hashToken(token), usadoEn: null, expira: { gt: new Date() } },
    select: { id: true, usuarioId: true },
  });
}

import { z } from "zod";

// Acepta "1800", "1,800.50" o "1800,50" (coma decimal).
export function parseMonto(raw: unknown): number {
  let s = String(raw ?? "").replace(/\s|S\/|s\//g, "");
  if (s.includes(",") && !s.includes(".")) s = s.replace(",", ".");
  else s = s.replace(/,/g, "");
  return s === "" ? NaN : Number(s);
}

export const montoSchema = z
  .unknown()
  .transform(parseMonto)
  .pipe(
    z
      .number({ error: "Escribe un monto válido" })
      .refine(Number.isFinite, "Escribe un monto válido")
      .positive("El monto debe ser mayor a 0")
      .max(10_000_000, "El monto es demasiado grande")
      .transform((n) => Math.round(n * 100) / 100),
  );

export const fechaSchema = z.iso.date("Elige una fecha válida");

export const mesSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Elige un mes válido")
  .transform((s) => {
    const [anio, mes] = s.split("-").map(Number);
    return { anio, mes };
  });

export const textoOpcional = z
  .string()
  .trim()
  .max(200, "Máximo 200 caracteres")
  .transform((s) => (s === "" ? null : s));

export type FormState = {
  error?: string;
  ok?: boolean;
  // Lo que se envió, para rellenar el formulario: React lo vacía al terminar la acción.
  values?: Record<string, string>;
};

export function fallo(formData: FormData, error: string): FormState {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$ACTION")) values[key] = value;
  }
  return { error, values };
}

export function primerError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Revisa los datos";
}

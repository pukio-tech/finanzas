// Las fechas "de calendario" (sin hora) se guardan en UTC a medianoche.
// "Hoy" se calcula en la zona horaria de Perú para que el mes cambie a la hora local.
export const APP_TZ = "America/Lima";

export type MesAnio = { anio: number; mes: number };

export function hoyISO(now: Date = new Date()) {
  // en-CA da el formato AAAA-MM-DD.
  return now.toLocaleDateString("en-CA", { timeZone: APP_TZ });
}

export function mesActual(now: Date = new Date()): MesAnio {
  const [anio, mes] = hoyISO(now).split("-").map(Number);
  return { anio, mes };
}

export function fechaDesdeISO(iso: string) {
  return new Date(`${iso}T00:00:00Z`);
}

export function isoDesdeFecha(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function sumarMeses({ anio, mes }: MesAnio, n: number): MesAnio {
  const total = anio * 12 + (mes - 1) + n;
  return { anio: Math.floor(total / 12), mes: (total % 12) + 1 };
}

export function indiceMes({ anio, mes }: MesAnio) {
  return anio * 12 + mes;
}

// Meses que quedan hasta una fecha, contando el mes actual (mínimo 1).
export function mesesHasta(fecha: Date, hoy: MesAnio = mesActual()) {
  const destino = { anio: fecha.getUTCFullYear(), mes: fecha.getUTCMonth() + 1 };
  return Math.max(1, indiceMes(destino) - indiceMes(hoy) + 1);
}

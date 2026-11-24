import { z } from "zod";

// Tarjetas del inicio que cada usuario puede mostrar, ocultar y ordenar.
// `ancho` es cuántas columnas ocupa en escritorio (de 4).

export const TARJETAS = {
  dinero: { nombre: "Dinero libre", descripcion: "Lo que tienes sin separar para metas", ancho: 1 },
  sueldo: { nombre: "Tu sueldo", descripcion: "Lo que te deben y tu próximo pago", ancho: 2 },
  deudas: { nombre: "Deudas", descripcion: "Lo que debes y lo que te deben", ancho: 1 },
  proyeccion: { nombre: "Proyección", descripcion: "Cuánto te sobraría o faltaría para tus metas", ancho: 1 },
  metas: { nombre: "Metas", descripcion: "El avance de lo que quieres comprar o pagar", ancho: 2 },
  pagos: { nombre: "Últimos pagos", descripcion: "Lo último que pagaste", ancho: 2 },
} as const;

export type Tarjeta = keyof typeof TARJETAS;
export const IDS_TARJETAS = Object.keys(TARJETAS) as Tarjeta[];

export type ConfigInicio = {
  orden: Tarjeta[];
  ocultas: Tarjeta[];
  // Opciones de "cómo" se ve cada tarjeta.
  sueldoMeses: boolean;
  metasCantidad: number; // 0 = todas
  pagosCantidad: number;
};

export const CONFIG_INICIO_DEFECTO: ConfigInicio = {
  orden: ["dinero", "sueldo", "deudas", "metas", "pagos", "proyeccion"],
  ocultas: ["proyeccion"],
  sueldoMeses: true,
  metasCantidad: 0,
  pagosCantidad: 5,
};

export const CANTIDADES_METAS = [3, 5, 0];
export const CANTIDADES_PAGOS = [3, 5, 10];

const esquema = z.object({
  orden: z.array(z.string()).optional(),
  ocultas: z.array(z.string()).optional(),
  sueldoMeses: z.boolean().optional(),
  metasCantidad: z.number().int().optional(),
  pagosCantidad: z.number().int().optional(),
});

// Acepta cualquier valor guardado (o nada) y devuelve una configuración completa y válida:
// ignora tarjetas desconocidas y agrega al final las que falten (por ejemplo, tarjetas nuevas).
export function normalizarConfigInicio(valor: unknown): ConfigInicio {
  const parsed = esquema.safeParse(valor);
  const v = parsed.success ? parsed.data : {};
  const valida = (id: string): id is Tarjeta => id in TARJETAS;

  const orden = [...new Set((v.orden ?? []).filter(valida))];
  for (const id of CONFIG_INICIO_DEFECTO.orden) if (!orden.includes(id)) orden.push(id);

  return {
    orden,
    ocultas: v.ocultas ? [...new Set(v.ocultas.filter(valida))] : CONFIG_INICIO_DEFECTO.ocultas,
    sueldoMeses: v.sueldoMeses ?? CONFIG_INICIO_DEFECTO.sueldoMeses,
    metasCantidad: CANTIDADES_METAS.includes(v.metasCantidad ?? -1) ? v.metasCantidad! : CONFIG_INICIO_DEFECTO.metasCantidad,
    pagosCantidad: CANTIDADES_PAGOS.includes(v.pagosCantidad ?? -1) ? v.pagosCantidad! : CONFIG_INICIO_DEFECTO.pagosCantidad,
  };
}

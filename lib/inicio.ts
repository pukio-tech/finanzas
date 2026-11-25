import { z } from "zod";

// Tarjetas del inicio que cada usuario puede mostrar, ocultar y ordenar.
// `ancho` es cuántas columnas ocupa en escritorio (de 4).

export const TARJETAS = {
  dinero: { nombre: "Dinero libre", descripcion: "Lo que tienes sin separar para metas", ancho: 1 },
  sueldo: { nombre: "Tu sueldo", descripcion: "Lo que te deben y tu próximo pago", ancho: 2 },
  aparte: {
    nombre: "Ingresos aparte",
    descripcion: "Los que llevas en otra cuenta, como un negocio. Solo sale si tienes alguno",
    ancho: 2,
  },
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
  orden: ["dinero", "sueldo", "deudas", "aparte", "metas", "pagos", "proyeccion"],
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
// ignora tarjetas desconocidas y agrega las que falten (tarjetas nuevas) después de la que
// las precede en el orden por defecto.
export function normalizarConfigInicio(valor: unknown): ConfigInicio {
  const parsed = esquema.safeParse(valor);
  const v = parsed.success ? parsed.data : {};
  const valida = (id: string): id is Tarjeta => id in TARJETAS;

  const orden = [...new Set((v.orden ?? []).filter(valida))];
  CONFIG_INICIO_DEFECTO.orden.forEach((id, i) => {
    if (orden.includes(id)) return;
    const anterior = CONFIG_INICIO_DEFECTO.orden[i - 1];
    orden.splice(anterior ? orden.indexOf(anterior) + 1 : 0, 0, id);
  });

  return {
    orden,
    ocultas: v.ocultas ? [...new Set(v.ocultas.filter(valida))] : CONFIG_INICIO_DEFECTO.ocultas,
    sueldoMeses: v.sueldoMeses ?? CONFIG_INICIO_DEFECTO.sueldoMeses,
    metasCantidad: CANTIDADES_METAS.includes(v.metasCantidad ?? -1) ? v.metasCantidad! : CONFIG_INICIO_DEFECTO.metasCantidad,
    pagosCantidad: CANTIDADES_PAGOS.includes(v.pagosCantidad ?? -1) ? v.pagosCantidad! : CONFIG_INICIO_DEFECTO.pagosCantidad,
  };
}

// Reparte las tarjetas en filas de 4 columnas respetando el orden: si la siguiente no entra en la
// fila, la última de la fila se estira hasta el borde para no dejar huecos.
export function acomodarFilas(tarjetas: Tarjeta[]) {
  const filas: { tarjeta: Tarjeta; columnas: number }[][] = [[]];
  let usadas = 0;
  for (const tarjeta of tarjetas) {
    const columnas = TARJETAS[tarjeta].ancho;
    const fila = filas.at(-1)!;
    if (usadas + columnas > 4) {
      fila.at(-1)!.columnas += 4 - usadas;
      filas.push([{ tarjeta, columnas }]);
      usadas = columnas;
    } else {
      fila.push({ tarjeta, columnas });
      usadas += columnas;
    }
  }
  const ultima = filas.at(-1)!.at(-1);
  if (ultima) ultima.columnas += 4 - usadas;
  return filas.flat();
}

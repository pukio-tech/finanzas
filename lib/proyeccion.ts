// Proyección de ahorro, igual que la hoja "AHORA TOTAL" del Excel:
// ahorro actual + lo que te deben del trabajo + ingresos de los próximos meses
// + lo que te deben − lo que debes − gastos fijos − metas = restante.
// Los meses cuentan desde el mes actual (inclusive) hasta el mes elegido. Todo en céntimos.

import { indiceMes, sumarMeses, type MesAnio } from "./fechas";

// `separado` es lo que ya juntaste para la meta (informativo: ya no está en tu dinero libre).
export type MetaProyeccion = { id: string; nombre: string; falta: number; separado?: number };

export type ProyeccionInput = {
  ahorroActual: number;
  // Ingresos de meses ya cerrados que aún no cobras.
  porCobrarVencido: number;
  // Ingreso por cobrar de cada mes, desde `desde` (índice 0) hasta `hasta`.
  ingresosPorMes: number[];
  gastoMensual: number;
  meDeben: number;
  debo: number;
  // En orden de prioridad: la primera se cubre primero.
  metas: MetaProyeccion[];
  desde: MesAnio;
  hasta: MesAnio;
};

export type MesProyeccion = MesAnio & { ingreso: number; acumulado: number; metasCubiertas: string[] };

export type Proyeccion = {
  meses: MesProyeccion[];
  ingresosFuturos: number;
  gastos: number;
  total: number;
  totalMetas: number;
  restante: number;
  metas: (MetaProyeccion & { cubiertaEn: MesAnio | null })[];
};

const c = (n: number) => Math.round(n * 100);
const s = (cents: number) => cents / 100;

export function calcularProyeccion(input: ProyeccionInput): Proyeccion {
  const cantidad = Math.max(1, indiceMes(input.hasta) - indiceMes(input.desde) + 1);
  const base = c(input.ahorroActual) + c(input.porCobrarVencido) + c(input.meDeben) - c(input.debo);
  const gasto = c(input.gastoMensual);

  // La meta k queda cubierta cuando el acumulado alcanza la suma de las metas 0..k.
  let necesidad = 0;
  const umbrales = input.metas.map((m) => (necesidad += c(m.falta)));
  const metas = input.metas.map((m) => ({ ...m, cubiertaEn: null as MesAnio | null }));

  let acumulado = base;
  let ingresosFuturos = 0;
  const meses: MesProyeccion[] = Array.from({ length: cantidad }, (_, i) => {
    const mes = sumarMeses(input.desde, i);
    const ingreso = c(input.ingresosPorMes[i] ?? 0);
    ingresosFuturos += ingreso;
    acumulado += ingreso - gasto;
    const metasCubiertas: string[] = [];
    metas.forEach((m, k) => {
      if (!m.cubiertaEn && acumulado >= umbrales[k]) {
        m.cubiertaEn = mes;
        metasCubiertas.push(m.nombre);
      }
    });
    return { ...mes, ingreso: s(ingreso), acumulado: s(acumulado), metasCubiertas };
  });

  return {
    meses,
    ingresosFuturos: s(ingresosFuturos),
    gastos: s(gasto * cantidad),
    total: s(acumulado),
    totalMetas: s(necesidad),
    restante: s(acumulado - necesidad),
    metas,
  };
}

// Cálculo de lo cobrado y lo que falta cobrar de un ingreso mensual.
// Cada mes desde `desde` espera `montoMensual` (o el monto del ajuste de ese mes).
// Los cobros se aplican del mes más antiguo al más nuevo. Todo en céntimos.

import { indiceMes, mesActual, sumarMeses, type MesAnio } from "./fechas";

export type IngresoInput = {
  desde: MesAnio;
  hasta: MesAnio | null;
  montoMensual: number;
  ajustes: { anio: number; mes: number; monto: number }[];
  cobros: number[];
};

export type MesIngreso = MesAnio & {
  esperado: number;
  recibido: number;
  falta: number;
  ajustado: boolean;
  // Mes ya cerrado (anterior al actual).
  vencido: boolean;
  actual: boolean;
};

export type EstadoIngreso = {
  meses: MesIngreso[];
  // Lo que te deben de meses ya cerrados.
  porCobrarVencido: number;
  porCobrarMesActual: number;
  // Cobros adelantados que aún no tienen mes que cubrir.
  saldoAFavor: number;
  totalRecibido: number;
};

const c = (n: number) => Math.round(n * 100);
const s = (cents: number) => cents / 100;

// Calcula los meses del ingreso hasta `vistaHasta` (por defecto, el mes actual).
export function calcularIngreso(
  input: IngresoInput,
  vistaHasta?: MesAnio,
  hoy: MesAnio = mesActual(),
): EstadoIngreso {
  const indiceHoy = indiceMes(hoy);
  const limiteVista = vistaHasta && indiceMes(vistaHasta) > indiceHoy ? vistaHasta : hoy;
  const ultimo = input.hasta && indiceMes(input.hasta) < indiceMes(limiteVista) ? input.hasta : limiteVista;
  const cantidad = Math.max(0, indiceMes(ultimo) - indiceMes(input.desde) + 1);

  const ajustes = new Map(input.ajustes.map((a) => [`${a.anio}-${a.mes}`, c(a.monto)]));
  let disponible = input.cobros.reduce((t, m) => t + c(m), 0);
  const totalRecibido = disponible;
  let vencido = 0;
  let mesActualFalta = 0;

  const meses = Array.from({ length: cantidad }, (_, i): MesIngreso => {
    const mes = sumarMeses(input.desde, i);
    const ajuste = ajustes.get(`${mes.anio}-${mes.mes}`);
    const esperado = ajuste ?? c(input.montoMensual);
    const recibido = Math.min(disponible, esperado);
    disponible -= recibido;
    const falta = esperado - recibido;
    const indice = indiceMes(mes);
    if (indice < indiceHoy) vencido += falta;
    if (indice === indiceHoy) mesActualFalta += falta;
    return {
      ...mes,
      esperado: s(esperado),
      recibido: s(recibido),
      falta: s(falta),
      ajustado: ajuste !== undefined,
      vencido: indice < indiceHoy,
      actual: indice === indiceHoy,
    };
  });

  return {
    meses,
    porCobrarVencido: s(vencido),
    porCobrarMesActual: s(mesActualFalta),
    saldoAFavor: s(disponible),
    totalRecibido: s(totalRecibido),
  };
}

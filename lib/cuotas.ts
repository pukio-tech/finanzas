// Cálculo de lo pagado y lo que falta en una cuota compartida.
// Se trabaja en céntimos (enteros) para evitar errores de redondeo.

import { indiceMes, mesActual as mesActualLima, type MesAnio } from "./fechas";

export type PeriodoInput = { id?: string; anio: number; mes: number; monto: number };
export type ParticipanteInput = { id: string; nombre: string; porcentaje: number; esPropio: boolean };
export type PagoInput = { participanteId: string; monto: number };

export type EstadoParticipante = {
  participanteId: string;
  esperado: number;
  pagado: number;
  faltante: number;
};

export type EstadoPeriodo = {
  id?: string;
  anio: number;
  mes: number;
  monto: number;
  // Mes ya cerrado (anterior al actual).
  vencido: boolean;
  actual: boolean;
  participantes: EstadoParticipante[];
  faltante: number;
};

export type ResumenParticipante = {
  participanteId: string;
  // Lo que falta en meses ya cerrados.
  faltanteVencido: number;
  // Lo que falta del mes en curso.
  faltanteMesActual: number;
  // Pagos adelantados que no tienen un mes que cubrir.
  saldoAFavor: number;
  totalPagado: number;
};

export type ResumenCuota = {
  periodos: EstadoPeriodo[];
  faltanteVencido: number;
  faltanteMesActual: number;
  porParticipante: ResumenParticipante[];
};

const toCents = (n: number) => Math.round(n * 100);
const fromCents = (c: number) => c / 100;

export function calcularCuota(
  periodos: PeriodoInput[],
  participantes: ParticipanteInput[],
  pagos: PagoInput[],
  hoy: MesAnio = mesActualLima(),
): ResumenCuota {
  const ordenados = [...periodos].sort((a, b) => a.anio - b.anio || a.mes - b.mes);
  const indiceHoy = indiceMes(hoy);

  // Pagos totales de cada participante; se van aplicando del mes más antiguo al más nuevo.
  const disponible = new Map<string, number>(participantes.map((p) => [p.id, 0]));
  for (const pago of pagos) {
    disponible.set(pago.participanteId, (disponible.get(pago.participanteId) ?? 0) + toCents(pago.monto));
  }
  const totalPagado = new Map(disponible);

  const vencidoPor = new Map<string, number>(participantes.map((p) => [p.id, 0]));
  const actualPor = new Map<string, number>(participantes.map((p) => [p.id, 0]));

  const resultado: EstadoPeriodo[] = ordenados.map((periodo) => {
    const montoCents = toCents(periodo.monto);
    const indice = indiceMes(periodo);
    const vencido = indice < indiceHoy;
    const actual = indice === indiceHoy;

    // El último participante se queda con el residuo para que la suma cuadre exacta.
    let asignado = 0;
    const estados = participantes.map((p, i) => {
      const esperado =
        i === participantes.length - 1
          ? montoCents - asignado
          : Math.round((montoCents * p.porcentaje) / 100);
      asignado += esperado;

      const saldo = disponible.get(p.id) ?? 0;
      const pagado = Math.min(saldo, esperado);
      disponible.set(p.id, saldo - pagado);
      const faltante = esperado - pagado;

      if (vencido) vencidoPor.set(p.id, (vencidoPor.get(p.id) ?? 0) + faltante);
      if (actual) actualPor.set(p.id, (actualPor.get(p.id) ?? 0) + faltante);
      return { participanteId: p.id, esperado, pagado, faltante };
    });

    return {
      id: periodo.id,
      anio: periodo.anio,
      mes: periodo.mes,
      monto: fromCents(montoCents),
      vencido,
      actual,
      faltante: fromCents(estados.reduce((s, e) => s + e.faltante, 0)),
      participantes: estados.map((e) => ({
        participanteId: e.participanteId,
        esperado: fromCents(e.esperado),
        pagado: fromCents(e.pagado),
        faltante: fromCents(e.faltante),
      })),
    };
  });

  const porParticipante = participantes.map((p) => ({
    participanteId: p.id,
    faltanteVencido: fromCents(vencidoPor.get(p.id) ?? 0),
    faltanteMesActual: fromCents(actualPor.get(p.id) ?? 0),
    saldoAFavor: fromCents(disponible.get(p.id) ?? 0),
    totalPagado: fromCents(totalPagado.get(p.id) ?? 0),
  }));

  return {
    periodos: resultado,
    faltanteVencido: fromCents([...vencidoPor.values()].reduce((s, c) => s + c, 0)),
    faltanteMesActual: fromCents([...actualPor.values()].reduce((s, c) => s + c, 0)),
    porParticipante,
  };
}

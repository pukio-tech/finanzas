// Cálculo de lo pagado y lo que falta en una cuota compartida.
// Se trabaja en céntimos (enteros) para evitar errores de redondeo.

export type PeriodoInput = { anio: number; mes: number; monto: number };
export type ParticipanteInput = { id: string; nombre: string; porcentaje: number; esPropio: boolean };
export type PagoInput = { participanteId: string; monto: number };

export type EstadoParticipante = {
  participanteId: string;
  esperado: number;
  pagado: number;
  faltante: number;
};

export type EstadoPeriodo = {
  anio: number;
  mes: number;
  monto: number;
  vencido: boolean;
  participantes: EstadoParticipante[];
  faltante: number;
};

export type ResumenCuota = {
  periodos: EstadoPeriodo[];
  // Lo que falta en meses ya cerrados (anteriores al mes actual).
  faltanteVencido: number;
  // Por participante: faltante vencido y saldo a favor (pagos adelantados sin mes que cubrir).
  porParticipante: { participanteId: string; faltanteVencido: number; saldoAFavor: number }[];
};

const toCents = (n: number) => Math.round(n * 100);
const fromCents = (c: number) => c / 100;

export function calcularCuota(
  periodos: PeriodoInput[],
  participantes: ParticipanteInput[],
  pagos: PagoInput[],
  hoy: Date = new Date(),
): ResumenCuota {
  const ordenados = [...periodos].sort((a, b) => a.anio - b.anio || a.mes - b.mes);
  const mesActual = hoy.getFullYear() * 12 + hoy.getMonth() + 1;

  // Pagos totales de cada participante; se van aplicando del mes más antiguo al más nuevo.
  const disponible = new Map<string, number>();
  for (const p of participantes) disponible.set(p.id, 0);
  for (const pago of pagos) {
    disponible.set(pago.participanteId, (disponible.get(pago.participanteId) ?? 0) + toCents(pago.monto));
  }

  const faltanteVencidoPor = new Map<string, number>(participantes.map((p) => [p.id, 0]));
  let faltanteVencido = 0;

  const resultado: EstadoPeriodo[] = ordenados.map((periodo) => {
    const montoCents = toCents(periodo.monto);
    const vencido = periodo.anio * 12 + periodo.mes < mesActual;

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

      if (vencido) {
        faltanteVencidoPor.set(p.id, (faltanteVencidoPor.get(p.id) ?? 0) + faltante);
        faltanteVencido += faltante;
      }
      return { participanteId: p.id, esperado, pagado, faltante };
    });

    return {
      anio: periodo.anio,
      mes: periodo.mes,
      monto: fromCents(montoCents),
      vencido,
      faltante: fromCents(estados.reduce((s, e) => s + e.faltante, 0)),
      participantes: estados.map((e) => ({
        participanteId: e.participanteId,
        esperado: fromCents(e.esperado),
        pagado: fromCents(e.pagado),
        faltante: fromCents(e.faltante),
      })),
    };
  });

  return {
    periodos: resultado,
    faltanteVencido: fromCents(faltanteVencido),
    porParticipante: participantes.map((p) => ({
      participanteId: p.id,
      faltanteVencido: fromCents(faltanteVencidoPor.get(p.id) ?? 0),
      saldoAFavor: fromCents(disponible.get(p.id) ?? 0),
    })),
  };
}

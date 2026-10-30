import "server-only";
import { io } from "next/cache";
import { notFound } from "next/navigation";
import { getCurrentUser } from "./auth";
import { calcularCuota } from "./cuotas";
import { db } from "./db";
import { mesActual } from "./fechas";

// Todas las funciones exportadas resuelven el usuario de la sesión;
// nunca reciben un userId desde afuera.

const num = (d: { toNumber(): number } | null | undefined) => (d ? d.toNumber() : 0);

// Carga cuotas del usuario con su estado calculado.
async function cargarCuotas(usuarioId: string, cuotaId?: string) {
  const cuotas = await db.cuota.findMany({
    where: { usuarioId, ...(cuotaId ? { id: cuotaId } : { activa: true }) },
    orderBy: { creadoEn: "asc" },
    include: {
      participantes: { orderBy: [{ esPropio: "desc" }, { nombre: "asc" }] },
      periodos: { orderBy: [{ anio: "asc" }, { mes: "asc" }] },
      pagos: {
        orderBy: [{ fecha: "desc" }, { creadoEn: "desc" }],
        select: { id: true, participanteId: true, fecha: true, monto: true, nota: true },
      },
    },
  });

  const hoy = mesActual();
  return cuotas.map((c) => {
    const participantes = c.participantes.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      porcentaje: num(p.porcentaje),
      esPropio: p.esPropio,
    }));
    const pagos = c.pagos.map((p) => ({
      id: p.id,
      participanteId: p.participanteId,
      fecha: p.fecha,
      monto: num(p.monto),
      nota: p.nota,
    }));
    const periodos = c.periodos.map((p) => ({ id: p.id, anio: p.anio, mes: p.mes, monto: num(p.monto) }));
    const calculo = calcularCuota(periodos, participantes, pagos, hoy);
    const periodoActual = calculo.periodos.find((p) => p.actual);

    return {
      id: c.id,
      concepto: c.concepto,
      activa: c.activa,
      participantes,
      pagos,
      montoMesActual: periodoActual?.monto ?? null,
      ...calculo,
    };
  });
}

export type CuotaDetalle = Awaited<ReturnType<typeof cargarCuotas>>[number];

export async function getCuotas() {
  const user = await getCurrentUser();
  await io();
  return cargarCuotas(user.id);
}

export async function getCuota(id: string) {
  const user = await getCurrentUser();
  await io();
  const [cuota] = await cargarCuotas(user.id, id);
  if (!cuota) notFound();
  return cuota;
}

export async function getResumen() {
  const user = await getCurrentUser();
  // Prisma y el cálculo por fecha leen valores que cambian por petición.
  await io();

  const [plan, metas, deudas, cuotas, ultimosPagos] = await Promise.all([
    db.planAhorro.findUnique({ where: { usuarioId: user.id } }),
    db.meta.findMany({
      where: { usuarioId: user.id, estado: "ACTIVA" },
      orderBy: [{ prioridad: "asc" }, { creadoEn: "asc" }],
      include: { aportes: { select: { monto: true } } },
    }),
    db.deuda.findMany({
      where: { usuarioId: user.id },
      include: { abonos: { select: { monto: true } } },
    }),
    cargarCuotas(user.id),
    db.pago.findMany({
      where: { usuarioId: user.id },
      orderBy: [{ fecha: "desc" }, { creadoEn: "desc" }],
      take: 5,
      include: { categoria: { select: { nombre: true, icono: true } } },
    }),
  ]);

  const pendiente = (d: (typeof deudas)[number]) =>
    Math.max(0, num(d.monto) - d.abonos.reduce((s, a) => s + num(a.monto), 0));

  return {
    user,
    ahorroActual: num(plan?.ahorroActual),
    ahorroMensual: num(plan?.ahorroMensual),
    metas: metas.map((m) => ({
      id: m.id,
      nombre: m.nombre,
      icono: m.icono,
      objetivo: num(m.montoObjetivo),
      aportado: m.aportes.reduce((s, a) => s + num(a.monto), 0),
    })),
    debo: deudas.filter((d) => d.tipo === "DEBO").reduce((s, d) => s + pendiente(d), 0),
    meDeben: deudas.filter((d) => d.tipo === "ME_DEBEN").reduce((s, d) => s + pendiente(d), 0),
    cuotas: cuotas.map((c) => {
      const propio = c.participantes.find((p) => p.esPropio);
      return {
        id: c.id,
        concepto: c.concepto,
        faltanteTotal: c.faltanteVencido,
        faltantePropio: propio
          ? c.porParticipante.find((p) => p.participanteId === propio.id)?.faltanteVencido ?? 0
          : 0,
      };
    }),
    ultimosPagos: ultimosPagos.map((p) => ({
      id: p.id,
      descripcion: p.descripcion,
      fecha: p.fecha,
      monto: num(p.monto),
      categoria: p.categoria?.nombre ?? null,
    })),
  };
}

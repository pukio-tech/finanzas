import "server-only";
import { io } from "next/cache";
import { getCurrentUser } from "./auth";
import { calcularCuota } from "./cuotas";
import { db } from "./db";

// Todas las funciones exportadas resuelven el usuario de la sesión;
// nunca reciben un userId desde afuera.

const num = (d: { toNumber(): number } | null | undefined) => (d ? d.toNumber() : 0);

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
    db.cuota.findMany({
      where: { usuarioId: user.id, activa: true },
      include: {
        participantes: { orderBy: { nombre: "asc" } },
        periodos: true,
        pagos: { select: { participanteId: true, monto: true } },
      },
    }),
    db.pago.findMany({
      where: { usuarioId: user.id },
      orderBy: [{ fecha: "desc" }, { creadoEn: "desc" }],
      take: 5,
      include: { categoria: { select: { nombre: true, icono: true } } },
    }),
  ]);

  const pendiente = (d: (typeof deudas)[number]) =>
    Math.max(0, num(d.monto) - d.abonos.reduce((s, a) => s + num(a.monto), 0));

  const resumenCuotas = cuotas.map((c) => {
    const calc = calcularCuota(
      c.periodos.map((p) => ({ anio: p.anio, mes: p.mes, monto: num(p.monto) })),
      c.participantes.map((p) => ({ id: p.id, nombre: p.nombre, porcentaje: num(p.porcentaje), esPropio: p.esPropio })),
      c.pagos.map((p) => ({ participanteId: p.participanteId, monto: num(p.monto) })),
    );
    const propio = c.participantes.find((p) => p.esPropio);
    return {
      id: c.id,
      concepto: c.concepto,
      faltanteTotal: calc.faltanteVencido,
      faltantePropio: propio
        ? calc.porParticipante.find((p) => p.participanteId === propio.id)?.faltanteVencido ?? 0
        : 0,
    };
  });

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
    cuotas: resumenCuotas,
    ultimosPagos: ultimosPagos.map((p) => ({
      id: p.id,
      descripcion: p.descripcion,
      fecha: p.fecha,
      monto: num(p.monto),
      categoria: p.categoria?.nombre ?? null,
    })),
  };
}

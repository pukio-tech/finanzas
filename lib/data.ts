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

// Suma en céntimos para no arrastrar errores de coma flotante.
const sumar = (montos: { monto: { toNumber(): number } }[]) =>
  montos.reduce((s, m) => s + Math.round(num(m.monto) * 100), 0) / 100;

// ---- Metas ----

export async function getMetas() {
  const user = await getCurrentUser();
  await io();
  const metas = await db.meta.findMany({
    where: { usuarioId: user.id },
    orderBy: [{ prioridad: "asc" }, { creadoEn: "asc" }],
    include: { aportes: { select: { monto: true } } },
  });
  return metas.map((m) => {
    const objetivo = num(m.montoObjetivo);
    const aportado = sumar(m.aportes);
    return {
      id: m.id,
      nombre: m.nombre,
      icono: m.icono,
      prioridad: m.prioridad,
      estado: m.estado,
      fechaObjetivo: m.fechaObjetivo,
      objetivo,
      aportado,
      falta: Math.max(0, Math.round((objetivo - aportado) * 100) / 100),
    };
  });
}

export async function getMeta(id: string) {
  const user = await getCurrentUser();
  await io();
  const meta = await db.meta.findFirst({
    where: { id, usuarioId: user.id },
    include: {
      aportes: {
        orderBy: [{ fecha: "desc" }, { id: "desc" }],
        include: { pago: { select: { id: true, descripcion: true } } },
      },
    },
  });
  if (!meta) notFound();
  const objetivo = num(meta.montoObjetivo);
  const aportado = sumar(meta.aportes);
  return {
    id: meta.id,
    nombre: meta.nombre,
    icono: meta.icono,
    prioridad: meta.prioridad,
    estado: meta.estado,
    fechaObjetivo: meta.fechaObjetivo,
    notas: meta.notas,
    objetivo,
    aportado,
    falta: Math.max(0, Math.round((objetivo - aportado) * 100) / 100),
    aportes: meta.aportes.map((a) => ({
      id: a.id,
      fecha: a.fecha,
      monto: num(a.monto),
      nota: a.nota,
      pago: a.pago,
    })),
  };
}

// ---- Deudas ----

export async function getDeudas() {
  const user = await getCurrentUser();
  await io();
  const deudas = await db.deuda.findMany({
    where: { usuarioId: user.id },
    orderBy: [{ fechaLimite: { sort: "asc", nulls: "last" } }, { fecha: "asc" }],
    include: { abonos: { select: { monto: true } } },
  });
  return deudas.map((d) => {
    const monto = num(d.monto);
    const abonado = sumar(d.abonos);
    return {
      id: d.id,
      tipo: d.tipo,
      contraparte: d.contraparte,
      descripcion: d.descripcion,
      fecha: d.fecha,
      fechaLimite: d.fechaLimite,
      monto,
      abonado,
      pendiente: Math.max(0, Math.round((monto - abonado) * 100) / 100),
    };
  });
}

export async function getDeuda(id: string) {
  const user = await getCurrentUser();
  await io();
  const deuda = await db.deuda.findFirst({
    where: { id, usuarioId: user.id },
    include: {
      abonos: {
        orderBy: [{ fecha: "desc" }, { id: "desc" }],
        include: { pago: { select: { id: true, descripcion: true } } },
      },
    },
  });
  if (!deuda) notFound();
  const monto = num(deuda.monto);
  const abonado = sumar(deuda.abonos);
  return {
    id: deuda.id,
    tipo: deuda.tipo,
    contraparte: deuda.contraparte,
    descripcion: deuda.descripcion,
    fecha: deuda.fecha,
    fechaLimite: deuda.fechaLimite,
    monto,
    abonado,
    pendiente: Math.max(0, Math.round((monto - abonado) * 100) / 100),
    abonos: deuda.abonos.map((a) => ({
      id: a.id,
      fecha: a.fecha,
      monto: num(a.monto),
      nota: a.nota,
      pago: a.pago,
    })),
  };
}

// ---- Pagos realizados ----

export async function getPagos(filtro: { anio: number; mes: number; categoriaId?: string }) {
  const user = await getCurrentUser();
  await io();
  const desde = new Date(Date.UTC(filtro.anio, filtro.mes - 1, 1));
  const hasta = new Date(Date.UTC(filtro.anio, filtro.mes, 1));

  const [pagos, categorias] = await Promise.all([
    db.pago.findMany({
      where: {
        usuarioId: user.id,
        fecha: { gte: desde, lt: hasta },
        ...(filtro.categoriaId ? { categoriaId: filtro.categoriaId } : {}),
      },
      orderBy: [{ fecha: "desc" }, { creadoEn: "desc" }],
      include: {
        categoria: { select: { nombre: true, icono: true } },
        aporte: { select: { meta: { select: { nombre: true } } } },
        abono: { select: { deuda: { select: { contraparte: true } } } },
      },
    }),
    db.categoria.findMany({ where: { usuarioId: user.id }, orderBy: { nombre: "asc" }, select: { id: true, nombre: true, icono: true } }),
  ]);

  return {
    categorias,
    total: pagos.reduce((s, p) => s + Math.round(num(p.monto) * 100), 0) / 100,
    pagos: pagos.map((p) => ({
      id: p.id,
      descripcion: p.descripcion,
      fecha: p.fecha,
      monto: num(p.monto),
      metodo: p.metodo,
      categoria: p.categoria,
      tieneVoucher: Boolean(p.voucherKey),
      vinculo: p.aporte ? `Meta: ${p.aporte.meta.nombre}` : p.abono ? `Deuda: ${p.abono.deuda.contraparte}` : null,
    })),
  };
}

export async function getPago(id: string) {
  const user = await getCurrentUser();
  await io();
  const pago = await db.pago.findFirst({
    where: { id, usuarioId: user.id },
    include: {
      categoria: { select: { id: true, nombre: true, icono: true } },
      aporte: { select: { meta: { select: { id: true, nombre: true } } } },
      abono: { select: { deuda: { select: { id: true, contraparte: true } } } },
    },
  });
  if (!pago) notFound();
  return {
    id: pago.id,
    descripcion: pago.descripcion,
    fecha: pago.fecha,
    monto: num(pago.monto),
    metodo: pago.metodo,
    categoria: pago.categoria,
    voucherTipo: pago.voucherKey ? pago.voucherTipo : null,
    meta: pago.aporte?.meta ?? null,
    deuda: pago.abono?.deuda ?? null,
  };
}

// Lo que el formulario de pago necesita para sus listas de opciones.
export async function getOpcionesPago() {
  const user = await getCurrentUser();
  await io();
  const [categorias, metas, deudas] = await Promise.all([
    db.categoria.findMany({ where: { usuarioId: user.id }, orderBy: { nombre: "asc" }, select: { id: true, nombre: true, icono: true } }),
    db.meta.findMany({
      where: { usuarioId: user.id, estado: "ACTIVA" },
      orderBy: [{ prioridad: "asc" }, { creadoEn: "asc" }],
      select: { id: true, nombre: true, montoObjetivo: true, aportes: { select: { monto: true } } },
    }),
    db.deuda.findMany({
      where: { usuarioId: user.id, tipo: "DEBO" },
      orderBy: { fecha: "asc" },
      select: { id: true, contraparte: true, monto: true, abonos: { select: { monto: true } } },
    }),
  ]);

  return {
    categorias,
    metas: metas.map((m) => ({
      id: m.id,
      nombre: m.nombre,
      falta: Math.max(0, num(m.montoObjetivo) - m.aportes.reduce((s, a) => s + num(a.monto), 0)),
    })),
    deudas: deudas.map((d) => ({
      id: d.id,
      nombre: d.contraparte,
      falta: Math.max(0, num(d.monto) - d.abonos.reduce((s, a) => s + num(a.monto), 0)),
    })),
  };
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
      icono: p.categoria?.icono ?? null,
    })),
  };
}

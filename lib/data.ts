import "server-only";
import { io } from "next/cache";
import { notFound } from "next/navigation";
import { getCurrentUser } from "./auth";
import { db } from "./db";
import { indiceMes, mesActual, sumarMeses, type MesAnio } from "./fechas";
import { calcularIngreso } from "./ingresos";
import { calcularProyeccion } from "./proyeccion";

// Todas las funciones exportadas resuelven el usuario de la sesión;
// nunca reciben un userId desde afuera.

const num = (d: { toNumber(): number } | null | undefined) => (d ? d.toNumber() : 0);

const aMes = (d: Date): MesAnio => ({ anio: d.getUTCFullYear(), mes: d.getUTCMonth() + 1 });

// Carga los ingresos del usuario con su estado calculado hasta `vistaHasta` (o el mes actual).
async function cargarIngresos(usuarioId: string, opciones: { ingresoId?: string; vistaHasta?: MesAnio } = {}) {
  const ingresos = await db.ingreso.findMany({
    where: { usuarioId, ...(opciones.ingresoId ? { id: opciones.ingresoId } : {}) },
    orderBy: { creadoEn: "asc" },
    include: {
      ajustes: true,
      cobros: { orderBy: [{ fecha: "desc" }, { creadoEn: "desc" }] },
    },
  });

  return ingresos.map((i) => {
    const estado = calcularIngreso(
      {
        desde: aMes(i.desde),
        hasta: i.hasta ? aMes(i.hasta) : null,
        montoMensual: num(i.montoMensual),
        ajustes: i.ajustes.map((a) => ({ anio: a.anio, mes: a.mes, monto: num(a.monto) })),
        cobros: i.cobros.map((c) => num(c.monto)),
      },
      opciones.vistaHasta,
    );
    return {
      id: i.id,
      nombre: i.nombre,
      montoMensual: num(i.montoMensual),
      desde: i.desde,
      hasta: i.hasta,
      cobros: i.cobros.map((c) => ({ id: c.id, fecha: c.fecha, monto: num(c.monto), nota: c.nota })),
      ...estado,
    };
  });
}

export type IngresoDetalle = Awaited<ReturnType<typeof cargarIngresos>>[number];

export async function getIngresos() {
  const user = await getCurrentUser();
  await io();
  return cargarIngresos(user.id);
}

// El detalle muestra también los próximos 3 meses.
export async function getIngreso(id: string) {
  const user = await getCurrentUser();
  await io();
  const [ingreso] = await cargarIngresos(user.id, { ingresoId: id, vistaHasta: sumarMeses(mesActual(), 3) });
  if (!ingreso) notFound();
  return ingreso;
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

// ---- Proyección ----

// Sin `hasta`, proyecta hasta la fecha objetivo más lejana de tus metas (o 5 meses, como el Excel).
export async function getProyeccion(hasta?: MesAnio) {
  const user = await getCurrentUser();
  await io();
  const [plan, metas, deudas, ingresosBase] = await Promise.all([
    db.planAhorro.findUnique({ where: { usuarioId: user.id } }),
    db.meta.findMany({
      where: { usuarioId: user.id, estado: "ACTIVA" },
      orderBy: [{ prioridad: "asc" }, { creadoEn: "asc" }],
      include: { aportes: { select: { monto: true } } },
    }),
    db.deuda.findMany({ where: { usuarioId: user.id }, include: { abonos: { select: { monto: true } } } }),
    db.ingreso.count({ where: { usuarioId: user.id } }),
  ]);

  const desde = mesActual();
  // Solo cuentan las metas que aún tienen saldo pendiente.
  const fechas = metas.flatMap((m) =>
    m.fechaObjetivo && num(m.montoObjetivo) > sumar(m.aportes) ? [{ anio: m.fechaObjetivo.getUTCFullYear(), mes: m.fechaObjetivo.getUTCMonth() + 1 }] : [],
  );
  const masLejana = fechas.sort((a, b) => indiceMes(b) - indiceMes(a))[0];
  const porDefecto = masLejana && indiceMes(masLejana) > indiceMes(desde) ? masLejana : sumarMeses(desde, 4);
  const limite = hasta && indiceMes(hasta) >= indiceMes(desde) ? hasta : porDefecto;

  // Ingreso por cobrar de cada mes del plazo, sumando todos los ingresos.
  const ingresos = ingresosBase > 0 ? await cargarIngresos(user.id, { vistaHasta: limite }) : [];
  const cantidad = indiceMes(limite) - indiceMes(desde) + 1;
  const ingresosPorMes = Array.from({ length: cantidad }, (_, i) => {
    const mes = sumarMeses(desde, i);
    const cents = ingresos.reduce(
      (t, ing) => t + Math.round((ing.meses.find((m) => m.anio === mes.anio && m.mes === mes.mes)?.falta ?? 0) * 100),
      0,
    );
    return cents / 100;
  });
  const porCobrarVencido = ingresos.reduce((t, ing) => t + Math.round(ing.porCobrarVencido * 100), 0) / 100;

  const pendiente = (tipo: "DEBO" | "ME_DEBEN") =>
    deudas
      .filter((d) => d.tipo === tipo)
      .reduce((s, d) => s + Math.max(0, Math.round(num(d.monto) * 100) - Math.round(sumar(d.abonos) * 100)), 0) / 100;

  const input = {
    ahorroActual: num(plan?.ahorroActual),
    gastoMensual: num(plan?.gastoMensual),
    porCobrarVencido,
    ingresosPorMes,
    tieneIngresos: ingresos.length > 0,
    meDeben: pendiente("ME_DEBEN"),
    debo: pendiente("DEBO"),
    metas: metas
      .map((m) => ({ id: m.id, nombre: m.nombre, falta: Math.max(0, Math.round((num(m.montoObjetivo) - sumar(m.aportes)) * 100) / 100) }))
      .filter((m) => m.falta > 0),
    desde,
    hasta: limite,
  };
  return { ...input, porDefecto, ...calcularProyeccion(input) };
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

  const [plan, metas, deudas, ingresos, ultimosPagos] = await Promise.all([
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
    cargarIngresos(user.id),
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
    metas: metas.map((m) => ({
      id: m.id,
      nombre: m.nombre,
      icono: m.icono,
      objetivo: num(m.montoObjetivo),
      aportado: m.aportes.reduce((s, a) => s + num(a.monto), 0),
    })),
    debo: deudas.filter((d) => d.tipo === "DEBO").reduce((s, d) => s + pendiente(d), 0),
    meDeben: deudas.filter((d) => d.tipo === "ME_DEBEN").reduce((s, d) => s + pendiente(d), 0),
    ingresos: ingresos.map((i) => ({
      id: i.id,
      nombre: i.nombre,
      montoMensual: i.montoMensual,
      porCobrarVencido: i.porCobrarVencido,
      porCobrarMesActual: i.porCobrarMesActual,
    })),
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

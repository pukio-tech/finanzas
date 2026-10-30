// Carga los datos del Excel inicial en una cuenta ya registrada.
// Uso: npm run importar-excel -- correo@ejemplo.com

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const fecha = (iso: string) => new Date(`${iso}T00:00:00Z`);

// Monto total de la cuota por mes en 2026 (hojas "Enero–Junio" y "Julio–Diciembre").
const PERIODOS_2026 = [1700, 700, 1700, 1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800];

// Pagos del dueño de la cuenta, tal como están en el Excel.
const PAGOS_PROPIOS = [
  ["2026-05-10", 100],
  ["2026-05-16", 500],
  ["2026-07-09", 4000],
  ["2026-07-24", 150],
  ["2026-08-04", 300],
  ["2026-09-20", 150],
  ["2026-10-13", 250],
  ["2026-10-24", 1000],
  ["2026-10-26", 500],
] as const;

// El Excel no tiene las fechas de Jhon, solo lo que le falta por mes:
// enero–agosto al día y 500 pendientes de septiembre.
const PAGOS_JHON = [
  ["2026-06-30", 4750, "Total enero–junio (importado del Excel)"],
  ["2026-09-30", 2200, "Julio, agosto y parte de septiembre (importado del Excel)"],
] as const;

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) throw new Error("Indica el correo de la cuenta: npm run importar-excel -- correo@ejemplo.com");

  const usuario = await db.usuario.findUnique({ where: { email } });
  if (!usuario) throw new Error(`No existe una cuenta con el correo ${email}. Regístrate primero en la app.`);

  const yaImportado = await db.cuota.findFirst({
    where: { usuarioId: usuario.id, concepto: "Cuota mensual compartida" },
  });
  if (yaImportado) throw new Error("Esta cuenta ya tiene los datos del Excel importados.");

  await db.$transaction(async (tx) => {
    const cuota = await tx.cuota.create({
      data: {
        usuarioId: usuario.id,
        concepto: "Cuota mensual compartida",
        participantes: {
          create: [
            { nombre: usuario.nombre, porcentaje: 50, esPropio: true },
            { nombre: "Jhon", porcentaje: 50 },
          ],
        },
        periodos: {
          create: PERIODOS_2026.map((monto, i) => ({ anio: 2026, mes: i + 1, monto })),
        },
      },
      include: { participantes: true },
    });

    const propio = cuota.participantes.find((p) => p.esPropio)!;
    const jhon = cuota.participantes.find((p) => !p.esPropio)!;

    await tx.pagoCuota.createMany({
      data: [
        ...PAGOS_PROPIOS.map(([f, monto]) => ({
          cuotaId: cuota.id,
          participanteId: propio.id,
          fecha: fecha(f),
          monto,
        })),
        ...PAGOS_JHON.map(([f, monto, nota]) => ({
          cuotaId: cuota.id,
          participanteId: jhon.id,
          fecha: fecha(f),
          monto,
          nota,
        })),
      ],
    });

    await tx.planAhorro.upsert({
      where: { usuarioId: usuario.id },
      create: { usuarioId: usuario.id, ahorroActual: 1600, ahorroMensual: 900 },
      update: { ahorroActual: 1600, ahorroMensual: 900 },
    });

    await tx.meta.createMany({
      data: [
        { usuarioId: usuario.id, nombre: "Universidad", montoObjetivo: 2800, prioridad: 1, icono: "graduation-cap" },
        { usuarioId: usuario.id, nombre: "Laptop", montoObjetivo: 2900, prioridad: 2, icono: "laptop" },
      ],
    });

    // En el Excel la deuda de 500 se suma al total, así que es dinero que te deben.
    await tx.deuda.create({
      data: {
        usuarioId: usuario.id,
        tipo: "ME_DEBEN",
        contraparte: "Por definir",
        descripcion: "Deuda del Excel (edita el nombre)",
        monto: 500,
        fecha: fecha("2026-10-01"),
      },
    });
  });

  console.log(`Datos del Excel importados en la cuenta de ${usuario.nombre}.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());

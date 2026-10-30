// Carga los datos del Excel inicial en una cuenta ya registrada.
// Uso: npm run importar-excel -- correo@ejemplo.com
//
// - Sueldo de S/ 900 al mes desde julio 2026, con los cobros recibidos.
//   De julio a septiembre se esperaban S/ 2,700 y se cobraron S/ 2,200: quedan S/ 500 de septiembre.
// - Ahorro actual: S/ 1,600.
// - Metas: Universidad (S/ 2,800) y Laptop (S/ 2,900), si aún no existen.

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const fecha = (iso: string) => new Date(`${iso}T00:00:00Z`);

const SUELDO = "Sueldo del trabajo";

const COBROS = [
  ["2026-08-04", 300],
  ["2026-09-20", 150],
  ["2026-10-13", 250],
  ["2026-10-24", 1000],
  ["2026-10-26", 500],
] as const;

const METAS = [
  { nombre: "Universidad", montoObjetivo: 2800, prioridad: 1, icono: "graduation-cap" },
  { nombre: "Laptop", montoObjetivo: 2900, prioridad: 2, icono: "laptop" },
];

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) throw new Error("Indica el correo de la cuenta: npm run importar-excel -- correo@ejemplo.com");

  const usuario = await db.usuario.findUnique({ where: { email } });
  if (!usuario) throw new Error(`No existe una cuenta con el correo ${email}. Regístrate primero en la app.`);

  const yaImportado = await db.ingreso.findFirst({ where: { usuarioId: usuario.id, nombre: SUELDO } });
  if (yaImportado) throw new Error(`Esta cuenta ya tiene el ingreso "${SUELDO}".`);

  const existentes = await db.meta.findMany({ where: { usuarioId: usuario.id }, select: { nombre: true } });
  const nombres = new Set(existentes.map((m) => m.nombre.trim().toLowerCase()));
  const metasNuevas = METAS.filter((m) => !nombres.has(m.nombre.toLowerCase()));

  await db.$transaction(async (tx) => {
    await tx.ingreso.create({
      data: {
        usuarioId: usuario.id,
        nombre: SUELDO,
        montoMensual: 900,
        desde: fecha("2026-07-01"),
        cobros: { create: COBROS.map(([f, monto]) => ({ fecha: fecha(f), monto })) },
      },
    });

    await tx.planAhorro.upsert({
      where: { usuarioId: usuario.id },
      create: { usuarioId: usuario.id, ahorroActual: 1600 },
      update: { ahorroActual: 1600 },
    });

    if (metasNuevas.length > 0) {
      await tx.meta.createMany({ data: metasNuevas.map((m) => ({ ...m, usuarioId: usuario.id })) });
    }
  });

  console.log(`Datos cargados en la cuenta de ${usuario.nombre}.`);
  console.log(`Metas que ya existían (no se duplicaron): ${existentes.map((m) => m.nombre).join(", ") || "ninguna"}`);
  console.log(`Metas creadas: ${metasNuevas.map((m) => m.nombre).join(", ") || "ninguna"}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());

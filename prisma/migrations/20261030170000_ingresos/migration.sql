-- DropForeignKey
ALTER TABLE "Cuota" DROP CONSTRAINT "Cuota_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "PagoCuota" DROP CONSTRAINT "PagoCuota_cuotaId_fkey";

-- DropForeignKey
ALTER TABLE "PagoCuota" DROP CONSTRAINT "PagoCuota_participanteId_fkey";

-- DropForeignKey
ALTER TABLE "ParticipanteCuota" DROP CONSTRAINT "ParticipanteCuota_cuotaId_fkey";

-- DropForeignKey
ALTER TABLE "PeriodoCuota" DROP CONSTRAINT "PeriodoCuota_cuotaId_fkey";

-- AlterTable
ALTER TABLE "PlanAhorro" DROP COLUMN "ahorroMensual",
ADD COLUMN     "gastoMensual" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "Cuota";

-- DropTable
DROP TABLE "PagoCuota";

-- DropTable
DROP TABLE "ParticipanteCuota";

-- DropTable
DROP TABLE "PeriodoCuota";

-- CreateTable
CREATE TABLE "Ingreso" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "montoMensual" DECIMAL(12,2) NOT NULL,
    "desde" DATE NOT NULL,
    "hasta" DATE,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ingreso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AjusteIngreso" (
    "id" TEXT NOT NULL,
    "ingresoId" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "AjusteIngreso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cobro" (
    "id" TEXT NOT NULL,
    "ingresoId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "nota" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cobro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ingreso_usuarioId_idx" ON "Ingreso"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "AjusteIngreso_ingresoId_anio_mes_key" ON "AjusteIngreso"("ingresoId", "anio", "mes");

-- CreateIndex
CREATE INDEX "Cobro_ingresoId_idx" ON "Cobro"("ingresoId");

-- AddForeignKey
ALTER TABLE "Ingreso" ADD CONSTRAINT "Ingreso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AjusteIngreso" ADD CONSTRAINT "AjusteIngreso_ingresoId_fkey" FOREIGN KEY ("ingresoId") REFERENCES "Ingreso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cobro" ADD CONSTRAINT "Cobro_ingresoId_fkey" FOREIGN KEY ("ingresoId") REFERENCES "Ingreso"("id") ON DELETE CASCADE ON UPDATE CASCADE;


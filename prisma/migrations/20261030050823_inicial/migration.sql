-- CreateEnum
CREATE TYPE "EstadoMeta" AS ENUM ('ACTIVA', 'COMPLETADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoDeuda" AS ENUM ('DEBO', 'ME_DEBEN');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'YAPE', 'PLIN', 'TRANSFERENCIA', 'TARJETA', 'OTRO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanAhorro" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "ahorroActual" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ahorroMensual" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanAhorro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cuota" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipanteCuota" (
    "id" TEXT NOT NULL,
    "cuotaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "porcentaje" DECIMAL(5,2) NOT NULL,
    "esPropio" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ParticipanteCuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeriodoCuota" (
    "id" TEXT NOT NULL,
    "cuotaId" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "PeriodoCuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagoCuota" (
    "id" TEXT NOT NULL,
    "cuotaId" TEXT NOT NULL,
    "participanteId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "nota" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PagoCuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meta" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "montoObjetivo" DECIMAL(12,2) NOT NULL,
    "prioridad" INTEGER NOT NULL DEFAULT 0,
    "fechaObjetivo" DATE,
    "icono" TEXT,
    "notas" TEXT,
    "estado" "EstadoMeta" NOT NULL DEFAULT 'ACTIVA',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Meta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AporteMeta" (
    "id" TEXT NOT NULL,
    "metaId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "nota" TEXT,
    "pagoId" TEXT,

    CONSTRAINT "AporteMeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deuda" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" "TipoDeuda" NOT NULL,
    "contraparte" TEXT NOT NULL,
    "descripcion" TEXT,
    "monto" DECIMAL(12,2) NOT NULL,
    "fecha" DATE NOT NULL,
    "fechaLimite" DATE,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deuda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbonoDeuda" (
    "id" TEXT NOT NULL,
    "deudaId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "nota" TEXT,
    "pagoId" TEXT,

    CONSTRAINT "AbonoDeuda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "icono" TEXT,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "categoriaId" TEXT,
    "fecha" DATE NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "metodo" "MetodoPago" NOT NULL DEFAULT 'EFECTIVO',
    "voucherKey" TEXT,
    "voucherTipo" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PlanAhorro_usuarioId_key" ON "PlanAhorro"("usuarioId");

-- CreateIndex
CREATE INDEX "Cuota_usuarioId_idx" ON "Cuota"("usuarioId");

-- CreateIndex
CREATE INDEX "ParticipanteCuota_cuotaId_idx" ON "ParticipanteCuota"("cuotaId");

-- CreateIndex
CREATE UNIQUE INDEX "PeriodoCuota_cuotaId_anio_mes_key" ON "PeriodoCuota"("cuotaId", "anio", "mes");

-- CreateIndex
CREATE INDEX "PagoCuota_cuotaId_participanteId_idx" ON "PagoCuota"("cuotaId", "participanteId");

-- CreateIndex
CREATE INDEX "Meta_usuarioId_idx" ON "Meta"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "AporteMeta_pagoId_key" ON "AporteMeta"("pagoId");

-- CreateIndex
CREATE INDEX "AporteMeta_metaId_idx" ON "AporteMeta"("metaId");

-- CreateIndex
CREATE INDEX "Deuda_usuarioId_idx" ON "Deuda"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "AbonoDeuda_pagoId_key" ON "AbonoDeuda"("pagoId");

-- CreateIndex
CREATE INDEX "AbonoDeuda_deudaId_idx" ON "AbonoDeuda"("deudaId");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_usuarioId_nombre_key" ON "Categoria"("usuarioId", "nombre");

-- CreateIndex
CREATE INDEX "Pago_usuarioId_fecha_idx" ON "Pago"("usuarioId", "fecha");

-- AddForeignKey
ALTER TABLE "PlanAhorro" ADD CONSTRAINT "PlanAhorro_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cuota" ADD CONSTRAINT "Cuota_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipanteCuota" ADD CONSTRAINT "ParticipanteCuota_cuotaId_fkey" FOREIGN KEY ("cuotaId") REFERENCES "Cuota"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodoCuota" ADD CONSTRAINT "PeriodoCuota_cuotaId_fkey" FOREIGN KEY ("cuotaId") REFERENCES "Cuota"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoCuota" ADD CONSTRAINT "PagoCuota_cuotaId_fkey" FOREIGN KEY ("cuotaId") REFERENCES "Cuota"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoCuota" ADD CONSTRAINT "PagoCuota_participanteId_fkey" FOREIGN KEY ("participanteId") REFERENCES "ParticipanteCuota"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meta" ADD CONSTRAINT "Meta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AporteMeta" ADD CONSTRAINT "AporteMeta_metaId_fkey" FOREIGN KEY ("metaId") REFERENCES "Meta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AporteMeta" ADD CONSTRAINT "AporteMeta_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "Pago"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deuda" ADD CONSTRAINT "Deuda_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbonoDeuda" ADD CONSTRAINT "AbonoDeuda_deudaId_fkey" FOREIGN KEY ("deudaId") REFERENCES "Deuda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbonoDeuda" ADD CONSTRAINT "AbonoDeuda_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "Pago"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

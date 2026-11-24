-- CreateTable
CREATE TABLE "AumentoDeuda" (
    "id" TEXT NOT NULL,
    "deudaId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "nota" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AumentoDeuda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AumentoDeuda_deudaId_idx" ON "AumentoDeuda"("deudaId");

-- AddForeignKey
ALTER TABLE "AumentoDeuda" ADD CONSTRAINT "AumentoDeuda_deudaId_fkey" FOREIGN KEY ("deudaId") REFERENCES "Deuda"("id") ON DELETE CASCADE ON UPDATE CASCADE;


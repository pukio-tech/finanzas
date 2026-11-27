-- AlterTable
ALTER TABLE "AumentoDeuda" ADD COLUMN     "movioLibre" BOOLEAN NOT NULL DEFAULT true;

-- La marca "cuenta aparte" de ingresos ya no se usa (se pasó a Ahorros).
ALTER TABLE "Ingreso" DROP COLUMN "aparte";

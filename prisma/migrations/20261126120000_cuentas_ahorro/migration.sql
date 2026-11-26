-- CreateEnum
CREATE TYPE "TipoMovimientoCuenta" AS ENUM ('ENTRADA', 'SALIDA');

-- CreateTable
CREATE TABLE "Cuenta" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cuenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoCuenta" (
    "id" TEXT NOT NULL,
    "cuentaId" TEXT NOT NULL,
    "tipo" "TipoMovimientoCuenta" NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "fecha" DATE NOT NULL,
    "nota" TEXT,
    "aLibre" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientoCuenta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Cuenta_usuarioId_idx" ON "Cuenta"("usuarioId");

-- CreateIndex
CREATE INDEX "MovimientoCuenta_cuentaId_idx" ON "MovimientoCuenta"("cuentaId");

-- AddForeignKey
ALTER TABLE "Cuenta" ADD CONSTRAINT "Cuenta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoCuenta" ADD CONSTRAINT "MovimientoCuenta_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "Cuenta"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Los ingresos que se llevaban "en cuenta aparte" pasan a ser cuentas de ahorro:
-- cada cobro se vuelve una entrada. Esos cobros nunca tocaron el dinero libre,
-- y las entradas tampoco lo hacen, así que el dinero libre no cambia.
INSERT INTO "Cuenta" ("id", "usuarioId", "nombre", "creadoEn")
SELECT "id", "usuarioId", "nombre", "creadoEn" FROM "Ingreso" WHERE "aparte";

INSERT INTO "MovimientoCuenta" ("id", "cuentaId", "tipo", "monto", "fecha", "nota", "creadoEn")
SELECT c."id", c."ingresoId", 'ENTRADA', c."monto", c."fecha", c."nota", c."creadoEn"
FROM "Cobro" c JOIN "Ingreso" i ON i."id" = c."ingresoId"
WHERE i."aparte";

DELETE FROM "Ingreso" WHERE "aparte";

-- La columna "aparte" se deja (ya sin uso) para no romper la versión anterior mientras se publica;
-- la siguiente migración generada la elimina.

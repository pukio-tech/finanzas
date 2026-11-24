import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Sin env() estricto para que `prisma generate` funcione aunque aún no exista .env.
    // Las migraciones van por la conexión directa de Neon (sin "-pooler"): a través del
    // pooler el candado de migración puede quedar tomado en una conexión del pool.
    // La app sigue usando DATABASE_URL tal cual (lib/db.ts).
    url: (process.env.DATABASE_URL ?? "").replace("-pooler.", "."),
  },
});

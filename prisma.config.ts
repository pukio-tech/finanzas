import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Sin env() estricto para que `prisma generate` funcione aunque aún no exista .env.
    url: process.env.DATABASE_URL ?? "",
  },
});

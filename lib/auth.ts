import "server-only";
import { redirect } from "next/navigation";
import { db } from "./db";
import { getSession } from "./session";

export type User = {
  id: string;
  nombre: string;
  email: string;
};

// Capa de acceso a datos: toda lectura de datos privados pasa por aquí.
export async function getCurrentUser(): Promise<User> {
  "use cache: private";

  // /salir borra una cookie vencida o inválida antes de ir al login.
  const { userId } = await getSession();
  if (!userId) redirect("/salir");

  const user = await db.usuario.findUnique({
    where: { id: userId },
    select: { id: true, nombre: true, email: true },
  });
  if (!user) redirect("/salir");

  return user;
}

// Para Server Actions: vuelve a leer la sesión en cada mutación.
export async function requireUserId(): Promise<string> {
  const { userId } = await getSession();
  if (!userId) redirect("/salir");
  return userId;
}

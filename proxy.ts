import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session-cookie";

// Chequeo optimista: solo mira si existe la cookie. La validación real
// ocurre en lib/auth.ts, cerca de los datos.
const PUBLIC_PATHS = ["/login", "/registro", "/recuperar", "/restablecer"];
// Con sesión iniciada no tiene sentido verlas; /restablecer sí, por si abres el enlace
// del correo en un equipo donde ya entraste.
const SOLO_SIN_SESION = ["/login", "/registro", "/recuperar"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (!hasSession && !PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (hasSession && SOLO_SIN_SESION.includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|icon-.*\\.png|.*\\.svg).*)"],
};

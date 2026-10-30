import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { urlVoucher } from "@/lib/s3";
import { getSession } from "@/lib/session";

// Redirige a una URL firmada (5 minutos) solo si el pago es del usuario de la sesión.
export async function GET(_request: Request, { params }: RouteContext<"/api/vouchers/[id]">) {
  const { userId } = await getSession();
  if (!userId) return new NextResponse("No autorizado", { status: 401 });

  const { id } = await params;
  const pago = await db.pago.findFirst({ where: { id, usuarioId: userId }, select: { voucherKey: true } });
  if (!pago?.voucherKey) return new NextResponse("No encontrado", { status: 404 });

  try {
    const url = await urlVoucher(pago.voucherKey);
    return NextResponse.redirect(url, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error(error);
    return new NextResponse("No se pudo obtener el voucher", { status: 502 });
  }
}

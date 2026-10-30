import type { Metadata } from "next";
import { Proximamente } from "@/components/proximamente";

export const metadata: Metadata = { title: "Registrar pago" };

export default function Page() {
  return <Proximamente titulo="Registrar pago" fase={3} />;
}

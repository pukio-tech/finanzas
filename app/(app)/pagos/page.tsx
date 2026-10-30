import type { Metadata } from "next";
import { Proximamente } from "@/components/proximamente";

export const metadata: Metadata = { title: "Pagos realizados" };

export default function Page() {
  return <Proximamente titulo="Pagos realizados" fase={3} />;
}

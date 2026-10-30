import type { Metadata } from "next";
import { Proximamente } from "@/components/proximamente";

export const metadata: Metadata = { title: "Cuotas" };

export default function Page() {
  return <Proximamente titulo="Cuotas" fase={2} />;
}

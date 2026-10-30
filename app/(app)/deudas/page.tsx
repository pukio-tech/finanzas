import type { Metadata } from "next";
import { Proximamente } from "@/components/proximamente";

export const metadata: Metadata = { title: "Deudas" };

export default function Page() {
  return <Proximamente titulo="Deudas" fase={4} />;
}

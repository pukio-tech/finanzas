import type { Metadata } from "next";
import { Proximamente } from "@/components/proximamente";

export const metadata: Metadata = { title: "Proyección" };

export default function Page() {
  return <Proximamente titulo="Proyección" fase={5} />;
}

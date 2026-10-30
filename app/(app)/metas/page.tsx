import type { Metadata } from "next";
import { Proximamente } from "@/components/proximamente";

export const metadata: Metadata = { title: "Metas" };

export default function Page() {
  return <Proximamente titulo="Metas" fase={4} />;
}

import { KavachaApp } from "@/components/kavacha-app";
import { getDashboardSnapshot } from "@/lib/synthetic-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Home() {
  const snapshot = getDashboardSnapshot();
  return <KavachaApp initialSnapshot={snapshot} />;
}

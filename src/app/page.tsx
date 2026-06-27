import { KavachaApp } from "@/components/kavacha-app";
import { getDashboardSnapshot } from "@/lib/synthetic-data";

export default function Home() {
  const snapshot = getDashboardSnapshot();
  return <KavachaApp initialSnapshot={snapshot} />;
}

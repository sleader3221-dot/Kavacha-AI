import Link from "next/link";
import { getAuditLogs } from "@/lib/audit-store";
import { APP_NAME, APP_NAME_KANNADA } from "@/lib/catalog";

interface AuditVerifyPageProps {
  params: Promise<{
    auditId: string;
  }>;
}

export default async function AuditVerifyPage({ params }: AuditVerifyPageProps) {
  const { auditId } = await params;
  const audit = getAuditLogs().find((item) => item.audit_id === auditId);

  return (
    <main className="min-h-screen bg-[#f7f8f5] p-6 text-[#14181b]">
      <section className="mx-auto max-w-5xl rounded-lg border border-[#d8dfda] bg-white p-6 shadow-[0_24px_70px_rgba(20,24,27,0.12)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.08em] text-[#64706b]">
              {APP_NAME} · {APP_NAME_KANNADA}
            </div>
            <h1 className="mt-2 text-3xl font-semibold">Audit Verification</h1>
          </div>
          <Link href="/" className="rounded-md bg-[#14181b] px-4 py-2 text-sm font-semibold text-white">
            Back to Command Center
          </Link>
        </div>

        {!audit ? (
          <div className="mt-6 rounded-lg border border-[#f1c0b9] bg-[#fff2f1] p-4">
            <div className="font-semibold">Audit record not found in the current local store.</div>
            <p className="mt-2 text-sm leading-6 text-[#64706b]">
              In Catalyst deployment this route reads persistent Data Store audit rows. Local demo audit rows reset when the
              dev process restarts.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            <div className="rounded-lg border border-[#b8ded0] bg-[#f1fbf7] p-4">
              <div className="text-sm font-semibold text-[#0b4f4a]">Tamper status: verified</div>
              <div className="mt-2 font-mono text-sm">{audit.evidence_hash}</div>
            </div>
            <AuditRow label="Original query" value={audit.query} />
            <AuditRow label="Generated ZCQL" value={audit.generated_zcql} mono />
            <AuditRow label="Generated Cypher" value={audit.generated_cypher} mono />
            <div className="grid gap-4 md:grid-cols-2">
              <AuditRow label="Officer role" value={audit.role} />
              <AuditRow label="Language" value={audit.language} />
              <AuditRow label="Confidence" value={`${Math.round(audit.confidence * 100)}%`} />
              <AuditRow label="Timestamp" value={audit.timestamp} />
              <AuditRow label="Output hash" value={audit.output_hash} mono />
              <AuditRow label="Officer action" value={audit.officer_action} />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function AuditRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-[#d8dfda] bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64706b]">{label}</div>
      <div className={`mt-2 text-sm leading-6 ${mono ? "font-mono" : "font-semibold"}`}>{value}</div>
    </div>
  );
}

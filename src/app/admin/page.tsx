import { ApplicationStatus } from "@prisma/client";
import Link from "next/link";
import { AdminTable } from "@/components/admin-table";
import { getAdminDashboardData } from "@/lib/admin";
import { requireAdminUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function statusLabel(status: ApplicationStatus) {
  if (status === ApplicationStatus.NEEDS_INFO) {
    return "CONTACTED";
  }

  return status;
}

export default async function AdminPage() {
  await requireAdminUser();
  const data = await getAdminDashboardData();

  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="mx-auto w-full max-w-6xl px-6 py-8 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-line pb-5">
          <Link href="/" className="text-base font-semibold text-moss">
            Academic Hub
          </Link>
          <Link href="/dashboard" className="rounded-md px-3 py-2 text-sm font-medium text-moss hover:bg-white">
            Dashboard
          </Link>
        </header>

        <section className="py-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-moss">Admin</p>
          <h1 className="mt-3 text-3xl font-semibold">Operations dashboard</h1>
        </section>

        <div className="grid gap-6">
          <AdminTable
            title="Pending B2/B3 applications"
            columns={["Lab", "Plan", "Contact", "Members", "Status"]}
            rows={data.pendingApplications}
            emptyLabel="No pending team applications."
            renderRow={(application) => (
              <tr key={application.id} className="border-b border-line last:border-b-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{application.labName}</p>
                  <p className="text-xs text-ink/60">{application.institution}</p>
                </td>
                <td className="px-4 py-3">{application.desiredPlanCode}</td>
                <td className="px-4 py-3">
                  <p>{application.applicantName}</p>
                  <p className="text-xs text-ink/60">{application.contactEmail}</p>
                </td>
                <td className="px-4 py-3">{application.memberCount}</td>
                <td className="px-4 py-3">{statusLabel(application.status)}</td>
              </tr>
            )}
          />

          <AdminTable
            title="Recent payment orders"
            columns={["Owner", "Plan", "Method", "Amount", "Status"]}
            rows={data.recentPaymentOrders}
            emptyLabel="No payment orders yet."
            renderRow={(order) => (
              <tr key={order.id} className="border-b border-line last:border-b-0">
                <td className="px-4 py-3">{order.ownerLabel ?? order.ownerId}</td>
                <td className="px-4 py-3">{order.planCode ?? "-"}</td>
                <td className="px-4 py-3">{order.method}</td>
                <td className="px-4 py-3">RMB {(order.amountCents / 100).toLocaleString("en-US")}</td>
                <td className="px-4 py-3">{order.status}</td>
              </tr>
            )}
          />

          <AdminTable
            title="Heavy usage owners"
            columns={["Owner", "Total tokens"]}
            rows={data.heavyUsageOwners}
            emptyLabel="No usage records yet."
            renderRow={(owner) => (
              <tr key={owner.ownerId} className="border-b border-line last:border-b-0">
                <td className="px-4 py-3">{owner.ownerLabel ?? owner.ownerId}</td>
                <td className="px-4 py-3">{owner.totalTokens.toLocaleString("en-US")}</td>
              </tr>
            )}
          />

          <AdminTable
            title="Recent workflow runs"
            columns={["Type", "Status", "User", "Input", "Output"]}
            rows={data.recentWorkflowRuns}
            emptyLabel="No workflow runs yet."
            renderRow={(run) => (
              <tr key={run.id} className="border-b border-line last:border-b-0">
                <td className="px-4 py-3">{run.type}</td>
                <td className="px-4 py-3">{run.status}</td>
                <td className="px-4 py-3">{run.userId}</td>
                <td className="max-w-xs px-4 py-3 text-ink/70">{run.inputSummary}</td>
                <td className="max-w-xs px-4 py-3 text-ink/70">{run.outputSummary ?? "-"}</td>
              </tr>
            )}
          />
        </div>
      </section>
    </main>
  );
}

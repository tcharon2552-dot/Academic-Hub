import { ApplicationStatus } from "@prisma/client";
import Link from "next/link";
import { listTeamApplications } from "@/lib/applications";

export const dynamic = "force-dynamic";

function statusLabel(status: ApplicationStatus) {
  if (status === ApplicationStatus.NEEDS_INFO) {
    return "CONTACTED";
  }

  return status;
}

export default async function AdminPage() {
  const applications = await listTeamApplications({
    take: 50
  });

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
          <h1 className="mt-3 text-3xl font-semibold">Team applications</h1>
        </section>

        <div className="overflow-x-auto rounded-md border border-line bg-white">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="border-b border-line bg-paper">
              <tr>
                <th className="px-4 py-3 font-semibold">Lab</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Members</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td className="px-4 py-5 text-ink/60" colSpan={6}>
                    No team applications yet.
                  </td>
                </tr>
              ) : (
                applications.map((application) => (
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
                    <td className="px-4 py-3 text-xs text-ink/60">Use API review action</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

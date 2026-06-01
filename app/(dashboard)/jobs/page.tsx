import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import JobsClient from "./jobs-client";

export default async function JobsPage() {
  const session = await requireSession();
  const userId = session.user.id;

  const jobs = await prisma.jobApplication.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 100,
  });

  const totalApps = jobs.length;
  const activeStatuses = ["SAVED", "APPLIED", "PHONE_SCREEN", "TECHNICAL", "INTERVIEW"];
  const activeApps = jobs.filter((j) => activeStatuses.includes(j.status)).length;
  const offers = jobs.filter((j) => j.status === "OFFER").length;
  const rejected = jobs.filter((j) => j.status === "REJECTED").length;

  return (
    <JobsClient
      initialJobs={jobs.map((job) => ({
        ...job,
        date: job.date.toISOString(),
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
      }))}
      totalApps={totalApps}
      activeApps={activeApps}
      offers={offers}
      rejected={rejected}
    />
  );
}

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#d1fae5,transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-3 py-4 sm:px-4 sm:py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl min-w-0">
        <DashboardClient />
      </div>
    </main>
  );
}

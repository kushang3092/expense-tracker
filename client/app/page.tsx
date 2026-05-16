import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";

import { AuthPanel } from "@/components/auth/AuthPanel";
import { authOptions } from "@/lib/auth";

const featureCards = [
  {
    title: "Expense + income tracking",
    description: "Capture every transaction with categories, notes, and receipt attachments.",
  },
  {
    title: "Budget monitoring",
    description: "Set monthly limits per category and spot overspending before it gets worse.",
  },
  {
    title: "Smart analytics",
    description: "See monthly spending, category mix, savings rate, and insight summaries at a glance.",
  },
];

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#fef3c7,transparent_22%),radial-gradient(circle_at_top_right,#bfdbfe,transparent_26%),linear-gradient(180deg,#f8fafc_0%,#ecfeff_55%,#f8fafc_100%)] px-3 py-4 sm:px-4 sm:py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl min-w-0">
        <div className="flex flex-col gap-3 rounded-3xl border border-white/60 bg-white/70 px-4 py-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:rounded-full sm:px-5">
          <div className="flex items-center gap-3 min-w-0">
            <Image src="/logo.png" alt="Xpense Tracker Logo" width={48} height={48} className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 object-contain" />
            <div className="min-w-0">
              <p className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold text-slate-900">
                Xpense Tracker
              </p>
              <p className="text-sm text-slate-500 hidden sm:block">Personal finance SaaS with smart analytics</p>
            </div>
          </div>
          <Link
            href={session ? "/dashboard" : "#auth"}
            className="hidden sm:inline-flex w-full justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white sm:w-auto"
          >
            {session ? "Open dashboard" : "Get started"}
          </Link>
        </div>

        <section className="grid flex-col gap-8 pb-8 pt-10 md:pb-10 md:pt-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-center">
          <div className="min-w-0 order-2 lg:order-1">
            <p className="text-xs uppercase tracking-[0.24em] text-teal-700 sm:text-sm sm:tracking-[0.35em]">Smart analytics for your money</p>
            <h1 className="mt-4 max-w-3xl font-[family-name:var(--font-space-grotesk)] text-4xl font-bold leading-tight text-slate-950 sm:text-5xl md:text-6xl">
              Understand where your money goes and what to change next.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:mt-6 sm:text-lg sm:leading-8">
              Track expenses, income, budgets, and receipt uploads in one place. Review monthly spending,
              category distribution, and savings rate with dashboard-ready charts.
            </p>
            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap sm:gap-4">
              <Link
                href={session ? "/dashboard" : "#auth"}
                className="inline-flex justify-center rounded-full bg-teal-600 px-6 py-3 font-medium text-white"
              >
                {session ? "View dashboard" : "Start with email"}
              </Link>
              <a
                href="#features"
                className="inline-flex justify-center rounded-full border border-slate-300 px-6 py-3 font-medium text-slate-900"
              >
                Explore features
              </a>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.75rem] bg-slate-900 p-5 text-white">
                <p className="text-sm text-slate-300">Monthly focus</p>
                <p className="mt-2 text-3xl font-semibold">40%</p>
                <p className="mt-2 text-sm text-slate-300">More clarity on spending patterns</p>
              </div>
              <div className="rounded-[1.75rem] bg-white/80 p-5 shadow-sm backdrop-blur">
                <p className="text-sm text-slate-500">Receipt uploads</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">S3</p>
                <p className="mt-2 text-sm text-slate-500">Cloud-ready storage pipeline</p>
              </div>
              <div className="rounded-[1.75rem] bg-amber-100 p-5">
                <p className="text-sm text-amber-900">Savings rate</p>
                <p className="mt-2 text-3xl font-semibold text-amber-950">Live</p>
                <p className="mt-2 text-sm text-amber-900">Calculated from income vs. expense data</p>
              </div>
            </div>
          </div>

          <div id="auth" className="min-w-0 order-1 lg:order-2">
            <AuthPanel />
          </div>
        </section>

        <section id="features" className="grid gap-5 py-8 md:grid-cols-3">
          {featureCards.map((feature) => (
            <article
              key={feature.title}
              className="rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur"
            >
              <p className="text-sm uppercase tracking-[0.25em] text-teal-700">Feature</p>
              <h2 className="mt-3 font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-slate-900 sm:text-2xl">
                {feature.title}
              </h2>
              <p className="mt-3 text-slate-600">{feature.description}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 py-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-[2rem] bg-slate-950 p-5 text-white shadow-[0_30px_100px_rgba(15,23,42,0.2)] sm:p-8">
            <p className="text-sm uppercase tracking-[0.25em] text-teal-300">Insight example</p>
            <h2 className="mt-3 font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold sm:text-3xl">
              {"\"You spent 40% more on food this month.\""}
            </h2>
            <p className="mt-4 max-w-xl text-slate-300">
              The backend already computes monthly comparisons and category leaders, so this project is set up
              for rule-based insights now and LLM-generated coaching next.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur sm:p-8">
            <p className="text-sm uppercase tracking-[0.25em] text-teal-700">What this stack includes</p>
            <div className="mt-4 grid gap-4 text-slate-700 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">Next.js app router frontend</div>
              <div className="rounded-2xl bg-slate-50 p-4">Express + MongoDB backend</div>
              <div className="rounded-2xl bg-slate-50 p-4">Email login + Google login</div>
              <div className="rounded-2xl bg-slate-50 p-4">Charts with Recharts</div>
              <div className="rounded-2xl bg-slate-50 p-4">Receipt upload endpoint for S3</div>
              <div className="rounded-2xl bg-slate-50 p-4">Analytics and insight scaffolding</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

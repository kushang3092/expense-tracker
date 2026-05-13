"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { uploadReceipt } from "@/lib/api";
import type { CategoryPoint, MonthOption } from "@/lib/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSelectedCategory } from "@/store/slices/dashboardSlice";
import {
  useGetAnalyticsQuery,
  useGetCategoryDistributionQuery,
  useGetIncomeSourceDistributionQuery,
} from "@/store/services/analyticsApi";
import { useGetBudgetsQuery, useCreateBudgetMutation } from "@/store/services/budgetsApi";
import { useCreateExpenseMutation, useGetExpensesQuery } from "@/store/services/expensesApi";
import { useCreateIncomeMutation, useGetIncomeQuery } from "@/store/services/incomeApi";
import Image from "next/image";

const chartColors = ["#0f766e", "#f97316", "#0f172a", "#14b8a6", "#f59e0b", "#475569"];

const categories = ["Food", "Transport", "Housing", "Shopping", "Health", "Bills", "Travel", "Other"];

function currency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function DashboardClient() {
  const { data: session } = useSession();
  const dispatch = useAppDispatch();
  const token = session?.accessToken;
  const selectedCategory = useAppSelector((state) => state.dashboard.selectedCategory);

  const [expenseReceipt, setExpenseReceipt] = useState<File | null>(null);
  const [expenseError, setExpenseError] = useState("");
  const [incomeError, setIncomeError] = useState("");
  const [budgetError, setBudgetError] = useState("");
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [selectedDistributionMonth, setSelectedDistributionMonth] = useState(getCurrentMonthKey());

  const analyticsQuery = useGetAnalyticsQuery(
    { token: token || "" },
    { skip: !token }
  );
  const categoryDistributionQuery = useGetCategoryDistributionQuery(
    { token: token || "", month: selectedDistributionMonth },
    { skip: !token }
  );
  const incomeSourceDistributionQuery = useGetIncomeSourceDistributionQuery(
    { token: token || "", month: selectedDistributionMonth },
    { skip: !token }
  );
  const expensesQuery = useGetExpensesQuery(
    { token: token || "" },
    { skip: !token }
  );
  const incomeQuery = useGetIncomeQuery(
    { token: token || "" },
    { skip: !token }
  );
  const budgetsQuery = useGetBudgetsQuery(
    { token: token || "" },
    { skip: !token }
  );

  const [createExpense, expenseMutation] = useCreateExpenseMutation();
  const [createIncome, incomeMutation] = useCreateIncomeMutation();
  const [createBudget, budgetMutation] = useCreateBudgetMutation();

  async function handleExpenseSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const form = event.currentTarget;

    const formData = new FormData(form);
    const payload: Record<string, unknown> = {
      amount: Number(formData.get("amount")),
      category: String(formData.get("category")),
      description: String(formData.get("description") || ""),
      date: String(formData.get("date") || new Date().toISOString()),
    };

    try {
      if (expenseReceipt) {
        const upload = await uploadReceipt(expenseReceipt, token);
        payload.receiptUrl = upload.receiptKey;
      }
      await createExpense({ token, ...(payload as {
        amount: number;
        category: string;
        description: string;
        date: string;
        receiptUrl?: string;
      }) }).unwrap();
      setExpenseError("");
      setExpenseReceipt(null);
      form.reset();
    } catch (error) {
      setExpenseError(error instanceof Error ? error.message : "Unable to save expense.");
    }
  }

  async function handleIncomeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    if (!token) return;

    try {
      await createIncome({
        token,
        amount: Number(formData.get("amount")),
        source: String(formData.get("source")),
        description: String(formData.get("description") || ""),
        date: String(formData.get("date") || new Date().toISOString()),
      }).unwrap();
      setIncomeError("");
      form.reset();
    } catch (error) {
      setIncomeError(error instanceof Error ? error.message : "Unable to save income.");
    }
  }

  async function handleBudgetSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    if (!token) return;

    try {
      await createBudget({
        token,
        category: String(formData.get("category")),
        limit: Number(formData.get("limit")),
        month: String(formData.get("month")),
      }).unwrap();
      setBudgetError("");
      form.reset();
    } catch (error) {
      setBudgetError(error instanceof Error ? error.message : "Unable to save budget.");
    }
  }

  const latestExpenses = useMemo(
    () =>
      (expensesQuery.data?.expenses || [])
        .filter((expense) => selectedCategory === "All" || expense.category === selectedCategory)
        .slice(0, 5),
    [expensesQuery.data?.expenses, selectedCategory]
  );
  const latestIncome = useMemo(() => incomeQuery.data?.income?.slice(0, 5) || [], [incomeQuery.data?.income]);
  const availableCategories = useMemo(() => ["All", ...categories], []);

  if (!token) {
    return <p className="text-sm text-slate-500">Your session is missing a backend token. Sign in again.</p>;
  }

  return (
    <div className="min-w-0 space-y-6 md:space-y-8">
      <div className="flex flex-col gap-4 rounded-[1.5rem] bg-slate-900 px-4 py-5 text-white shadow-[0_30px_80px_rgba(15,23,42,0.25)] sm:rounded-[2rem] sm:px-6 sm:py-6 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.22em] text-teal-300 sm:text-sm sm:tracking-[0.3em]">Xpense Tracker</p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Welcome back, {session.user?.name || "there"}.</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Monitor spending, income, budgets, receipts, and monthly trends from one dashboard.
          </p>
        </div>
        <div className="relative self-start md:self-auto">
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((open) => !open)}
            className="flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-2 py-2 text-left text-white transition hover:border-white/40 hover:bg-white/15 cursor-pointer"
          >
            {session.user?.image ? (
              <Image
                src={session.user.image}
                alt={session.user?.name || "Profile"}
                className="h-10 w-10 rounded-full object-cover"
                height={100}
                width={100}
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-500 text-sm font-semibold text-white">
                {getInitials(session.user?.name, session.user?.email)}
              </div>
            )}
            {/* <div className="hidden pr-2 md:block">
              <p className="text-sm font-medium text-white">{session.user?.name || "Profile"}</p>
              <p className="text-xs text-slate-300">{session.user?.email || "Manage account"}</p>
            </div> */}
          </button>

          {isProfileMenuOpen ? (
            <div className="absolute left-0 top-full z-20 mt-3 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] sm:left-auto sm:right-0">
              <div className="border-b border-slate-100 px-5 py-4">
                <p className="font-medium text-slate-900">{session.user?.name || "User"}</p>
                <p className="mt-1 text-sm text-slate-500">{session.user?.email || "No email available"}</p>
              </div>
              <div className="p-3">
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-rose-600 bg-rose-50 transition hover:bg-rose-100 cursor-pointer"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 md:gap-4 xl:grid-cols-4">
        <MetricCard title="Monthly spend" value={currency(analyticsQuery.data?.overview.currentExpenseTotal || 0)} />
        <MetricCard title="Monthly income" value={currency(analyticsQuery.data?.overview.currentIncomeTotal || 0)} />
        <MetricCard title="Savings rate" value={`${analyticsQuery.data?.overview.savingsRate || 0}%`} />
        <MetricCard title="Spend change" value={`${analyticsQuery.data?.overview.expenseChange || 0}%`} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6 xl:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-teal-700">Trend</p>
              <h2 className="text-xl font-semibold text-slate-900">Monthly spending</h2>
            </div>
          </div>
          <div className="h-64 min-w-0 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsQuery.data?.charts.monthlySpending || []}>
                <XAxis dataKey="label" stroke="#475569" />
                <YAxis stroke="#475569" />
                <Tooltip />
                <Line type="monotone" dataKey="spending" stroke="#0f766e" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <DistributionCard
          title="Expense mix"
          subtitle="Categories"
          monthLabel={categoryDistributionQuery.data?.label || "Selected month"}
          months={categoryDistributionQuery.data?.availableMonths || []}
          selectedMonth={selectedDistributionMonth}
          onMonthChange={setSelectedDistributionMonth}
          data={categoryDistributionQuery.data?.distribution || []}
          emptyMessage="No expenses recorded for this month."
        />

        <DistributionCard
          title="Income mix"
          subtitle="Sources"
          monthLabel={incomeSourceDistributionQuery.data?.label || "Selected month"}
          months={incomeSourceDistributionQuery.data?.availableMonths || []}
          selectedMonth={selectedDistributionMonth}
          onMonthChange={setSelectedDistributionMonth}
          data={incomeSourceDistributionQuery.data?.distribution || []}
          emptyMessage="No income recorded for this month."
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <FormCard title="Add expense" subtitle="Attach a receipt now or later.">
          <form onSubmit={handleExpenseSubmit} className="grid gap-3">
            <input name="amount" type="number" step="0.01" placeholder="Amount" className="input" required />
            <select name="category" className="input" defaultValue="Food">
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <input name="description" placeholder="Description" className="input" />
            <input name="date" type="date" className="input" />
            <input type="file" accept="image/*" onChange={(event) => setExpenseReceipt(event.target.files?.[0] || null)} className="block w-full min-w-0 overflow-hidden rounded-xl border border-slate-300 bg-gray-100 px-3 py-2 text-sm text-slate-500" />
            {expenseError ? <p className="text-sm text-rose-600">{expenseError}</p> : null}
            <button type="submit" className="button-dark" disabled={expenseMutation.isLoading}>
              {expenseMutation.isLoading ? "Saving..." : "Save expense"}
            </button>
          </form>
        </FormCard>

        <FormCard title="Add income" subtitle="Track salaries, freelance work, or other inflows.">
          <form onSubmit={handleIncomeSubmit} className="grid gap-3">
            <input name="amount" type="number" step="0.01" placeholder="Amount" className="input" required />
            <input name="source" placeholder="Source" className="input" required />
            <input name="description" placeholder="Description" className="input" />
            <input name="date" type="date" className="input" />
            {incomeError ? <p className="text-sm text-rose-600">{incomeError}</p> : null}
            <button type="submit" className="button-dark" disabled={incomeMutation.isLoading}>
              {incomeMutation.isLoading ? "Saving..." : "Save income"}
            </button>
          </form>
        </FormCard>

        <FormCard title="Set budget" subtitle="Keep category spending under control.">
          <form onSubmit={handleBudgetSubmit} className="grid gap-3">
            <select name="category" className="input" defaultValue="Food">
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <input name="limit" type="number" step="0.01" placeholder="Monthly limit" className="input" required />
            <input
              name="month"
              type="month"
              className="input"
              defaultValue={new Date().toISOString().slice(0, 7)}
              required
            />
            {budgetError ? <p className="text-sm text-rose-600">{budgetError}</p> : null}
            <button type="submit" className="button-dark" disabled={budgetMutation.isLoading}>
              {budgetMutation.isLoading ? "Saving..." : "Save budget"}
            </button>
          </form>
        </FormCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr] xl:gap-6">
        <InfoCard title="AI-style insights">
          <div className="grid gap-3">
            {(analyticsQuery.data?.insights || []).map((insight) => (
              <div key={insight} className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-950">
                {insight}
              </div>
            ))}
          </div>
        </InfoCard>

        <InfoCard title="Recent expenses" href="/dashboard/expenses">
          
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {availableCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => dispatch(setSelectedCategory(category))}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    selectedCategory === category
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            
          </div>
          <div className="grid max-h-70 gap-3 overflow-y-auto">
            {latestExpenses.map((expense) => (
              <RecordRow
                key={expense._id}
                title={expense.category}
                meta={expense.description || new Date(expense.date).toLocaleDateString()}
                value={currency(expense.amount)}
              />
            ))}
          </div>
        </InfoCard>

        <InfoCard title="Recent income">
          <div className="grid gap-3">
            {latestIncome.map((item) => (
              <RecordRow
                key={item._id}
                title={item.source}
                meta={item.description || new Date(item.date).toLocaleDateString()}
                value={currency(item.amount)}
              />
            ))}
          </div>
        </InfoCard>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <p className="text-sm uppercase tracking-[0.25em] text-teal-700">Budgets</p>
          <h2 className="text-xl font-semibold text-slate-900">Monthly progress</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(analyticsQuery.data?.budgets || budgetsQuery.data?.budgets || []).map((budget) => {
            const spent = Number(budget.spent || 0);
            const limit = Number(budget.limit || 0);
            const progress = limit ? Math.min(100, (spent / limit) * 100) : 0;

            return (
              <div key={budget._id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-slate-900">{budget.category}</h3>
                  <span className="text-sm text-slate-500">{budget.month}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {currency(spent)} / {currency(limit)}
                </p>
                <div className="mt-3 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-teal-600" style={{ width: `${progress}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[1.75rem] sm:p-5">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-3 break-words text-2xl font-semibold text-slate-900 sm:text-3xl">{value}</p>
    </div>
  );
}

function DistributionCard({
  title,
  subtitle,
  monthLabel,
  months,
  selectedMonth,
  onMonthChange,
  data,
  emptyMessage,
}: {
  title: string;
  subtitle: string;
  monthLabel: string;
  months: MonthOption[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  data: CategoryPoint[];
  emptyMessage: string;
}) {
  const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0);

  return (
    <div className="min-w-0 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-teal-700 sm:text-sm sm:tracking-[0.25em]">Mix</p>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {subtitle} for {monthLabel}
          </p>
        </div>
        <select
          value={selectedMonth}
          onChange={(event) => onMonthChange(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none sm:w-auto"
        >
          {months.map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </select>
      </div>

      {data.length > 0 ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center lg:gap-5">
          <div className="h-60 min-w-0 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="50%"
                  outerRadius="78%"
                  paddingAngle={2}
                >
                  {data.map((entry, index) => (
                    <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => currency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl bg-slate-50 py-2">
            <div className="border-b border-slate-200 px-3 pb-2">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Total</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{currency(total)}</p>
            </div>
            <div className="max-h-56 overflow-y-auto py-1">
              {data.slice(0, 6).map((item, index) => (
                <div key={item.name} className="flex items-center justify-between gap-3 px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: chartColors[index % chartColors.length] }}
                    />
                    <span className="truncate text-sm font-medium text-slate-700">{item.name}</span>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-slate-900">{currency(item.value)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex h-56 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-sm text-slate-500 sm:h-72">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}

function FormCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-5">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function InfoCard({ title, href, children }: { title: string; href?: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {title === "Recent expenses" && href ? (
        <Link
          href="/expenses"
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition bg-gray-500 hover:border-slate-300 hover:bg-gray-600 text-white"
        >
          View all
        </Link>) : null}
        </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function RecordRow({ title, meta, value }: { title: string; meta: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate font-medium text-slate-900">{title}</p>
        <p className="truncate text-sm text-slate-500">{meta}</p>
      </div>
      <p className="shrink-0 text-sm font-semibold text-slate-900 sm:text-base">{value}</p>
    </div>
  );
}

function getInitials(name?: string | null, email?: string | null) {
  if (name) {
    const parts = name.trim().split(" ").filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("");
  }

  if (email) {
    return email.slice(0, 2).toUpperCase();
  }

  return "U";
}

function getCurrentMonthKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

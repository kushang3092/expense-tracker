"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useState, useEffect } from "react";
import { Loader } from "@/components/ui/Loader";
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
  const [incomeReceipt, setIncomeReceipt] = useState<File | null>(null);
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

    const payload: {
      token: string;
      amount: number;
      source: string;
      description: string;
      date: string;
      receiptUrl?: string;
    } = {
      token,
      amount: Number(formData.get("amount")),
      source: String(formData.get("source")),
      description: String(formData.get("description") || ""),
      date: String(formData.get("date") || new Date().toISOString()),
    };

    try {
      if (incomeReceipt) {
        const upload = await uploadReceipt(incomeReceipt, token);
        payload.receiptUrl = upload.receiptKey;
      }
      
      await createIncome(payload).unwrap();
      setIncomeError("");
      setIncomeReceipt(null);
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

  const [showTokenError, setShowTokenError] = useState(false);
  useEffect(() => {
    if (!token) {
      const timer = setTimeout(() => setShowTokenError(true), 10000);
      return () => clearTimeout(timer);
    }
  }, [token]);

  if (status === "loading" || (!token && !showTokenError)) {
    return <Loader message="Loading dashboard..." />;
  }

  if (!token) {
    return <p className="text-sm text-slate-500 text-center mt-8">Your session is missing a backend token. Sign in again.</p>;
  }

  return (
    <div className="flex flex-col min-w-0 gap-6 md:gap-8">
      <div className="order-1 flex flex-row items-center justify-between gap-4 rounded-[1.5rem] bg-slate-900 px-4 py-5 text-white shadow-[0_30px_80px_rgba(15,23,42,0.25)] sm:rounded-[2rem] sm:px-6 sm:py-6">
        <div className="flex items-center gap-3 min-w-0">
          <Image src="/logo.png" alt="Xpense Tracker Logo" width={40} height={40} className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 object-contain" />
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.22em] text-teal-300 sm:text-sm sm:tracking-[0.3em]">Xpense Tracker</p>
            {/* <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Welcome back, {session.user?.name || "there"}.</h1> */}
            <p className="mt-2 max-w-2xl text-sm text-slate-300 hidden sm:block">
              Monitor spending, income, budgets, receipts, and monthly trends from one dashboard.
            </p>
            <p className="mt-1 max-w-2xl text-xs text-slate-300 sm:hidden">
              Monitor spending, income & budgets.
            </p>
          </div>
        </div>
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((open) => !open)}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 p-1 text-white transition hover:border-white/40 hover:bg-white/15 cursor-pointer"
          >
            {session.user?.image ? (
              <Image
                src={session.user.image}
                alt={session.user?.name || "Profile"}
                className="h-full w-full rounded-full object-cover"
                height={48}
                width={48}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-teal-500 text-sm font-semibold text-white">
                {getInitials(session.user?.name, session.user?.email)}
              </div>
            )}
            {/* <div className="hidden pr-2 md:block">
              <p className="text-sm font-medium text-white">{session.user?.name || "Profile"}</p>
              <p className="text-xs text-slate-300">{session.user?.email || "Manage account"}</p>
            </div> */}
          </button>

          {isProfileMenuOpen ? (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsProfileMenuOpen(false)} 
                aria-hidden="true"
              />
              <div className="absolute right-0 sm:right-0 top-full z-20 mt-3 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
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
            </>
          ) : null}
        </div>
      </div>

      <section className="order-2 grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <MetricCard 
          title="Monthly spend" 
          value={currency(analyticsQuery.data?.overview.currentExpenseTotal || 0)} 
          onAddClick={() => document.getElementById("add-expense")?.scrollIntoView({ behavior: "smooth" })}
          viewHref="/expenses"
          actionColor="rose"
        />
        <MetricCard 
          title="Monthly income" 
          value={currency(analyticsQuery.data?.overview.currentIncomeTotal || 0)} 
          onAddClick={() => document.getElementById("add-income")?.scrollIntoView({ behavior: "smooth" })}
          viewHref="/incomes"
          actionColor="teal"
        />
        <MetricCard title="Savings rate" value={`${analyticsQuery.data?.overview.savingsRate || 0}%`} />
        <MetricCard title="Spend change" value={`${analyticsQuery.data?.overview.expenseChange || 0}%`} />
      </section>

      <section className="order-4 lg:order-3 grid gap-6 xl:grid-cols-2">
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
          title="Expenses"
          subtitle="Categories"
          monthLabel={categoryDistributionQuery.data?.label || "Selected month"}
          months={categoryDistributionQuery.data?.availableMonths || []}
          selectedMonth={selectedDistributionMonth}
          onMonthChange={setSelectedDistributionMonth}
          data={categoryDistributionQuery.data?.distribution || []}
          emptyMessage="No expenses recorded for this month."
        />

        <DistributionCard
          title="Income"
          subtitle="Sources"
          monthLabel={incomeSourceDistributionQuery.data?.label || "Selected month"}
          months={incomeSourceDistributionQuery.data?.availableMonths || []}
          selectedMonth={selectedDistributionMonth}
          onMonthChange={setSelectedDistributionMonth}
          data={incomeSourceDistributionQuery.data?.distribution || []}
          emptyMessage="No income recorded for this month."
        />
      </section>

      <section className="order-3 lg:order-4 grid gap-4 lg:grid-cols-3 lg:gap-6">
        <FormCard id="add-expense" title="Add expense" subtitle="Attach a receipt now or later.">
          <form onSubmit={handleExpenseSubmit} className="grid gap-3">
            <input name="amount" type="number" step="0.01" placeholder="Amount" className="input" required />
            <select name="category" className="input" defaultValue="Food">
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <textarea name="description" placeholder="Description" className="input resize-none" rows={2} />
            <input name="date" type="date" className="input" />
            <input type="file" accept="image/*" onChange={(event) => setExpenseReceipt(event.target.files?.[0] || null)} className="block w-full min-w-0 overflow-hidden rounded-xl border border-slate-300 bg-gray-100 px-3 py-2 text-sm text-slate-500" />
            {expenseError ? <p className="text-sm text-rose-600">{expenseError}</p> : null}
            <button type="submit" className="button-dark" disabled={expenseMutation.isLoading}>
              {expenseMutation.isLoading ? "Saving..." : "Save expense"}
            </button>
          </form>
        </FormCard>

        <FormCard id="add-income" title="Add income" subtitle="Track salaries, freelance work, or other inflows.">
          <form onSubmit={handleIncomeSubmit} className="grid gap-3">
            <input name="amount" type="number" step="0.01" placeholder="Amount" className="input" required />
            <input name="source" placeholder="Source" className="input" required />
            <textarea name="description" placeholder="Description" className="input resize-none" rows={2} />
            <input name="date" type="date" className="input" />
            <input type="file" accept="image/*,.pdf,.doc,.docx" onChange={(event) => setIncomeReceipt(event.target.files?.[0] || null)} className="block w-full min-w-0 overflow-hidden rounded-xl border border-slate-300 bg-gray-100 px-3 py-2 text-sm text-slate-500" />
            {incomeError ? <p className="text-sm text-rose-600">{incomeError}</p> : null}
            <button type="submit" className="button-dark" disabled={incomeMutation.isLoading}>
              {incomeMutation.isLoading ? "Saving..." : "Save income"}
            </button>
          </form>
        </FormCard>

        <FormCard id="set-budget" title="Set budget" subtitle="Keep category spending under control.">
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

      <section className="order-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr] xl:gap-6">
        <InfoCard title="AI-style insights">
          <div className="grid gap-3">
            {(analyticsQuery.data?.insights || []).map((insight) => (
              <div key={insight} className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-950">
                {insight}
              </div>
            ))}
          </div>
        </InfoCard>

        <InfoCard title="Recent expenses" href="/expenses">
          
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

        <InfoCard title="Recent income" href="/incomes">
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

      <section className="order-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
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

function MetricCard({ title, value, onAddClick, viewHref, actionColor = "rose" }: { title: string; value: string; onAddClick?: () => void; viewHref?: string; actionColor?: "rose" | "teal" }) {
  const colorClass = actionColor === "rose" ? "text-rose-600 border-rose-600 hover:bg-rose-50" : "text-teal-600 border-teal-600 hover:bg-teal-50";
  return (
    <div className="min-w-0 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[1.75rem] sm:p-5">
      <div className="flex justify-between items-start h-full">
        <div className="flex flex-col justify-between h-full">
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-3 break-words text-lg font-semibold text-slate-900 sm:text-2xl lg:text-3xl">{value}</p>
        </div>
        {(onAddClick || viewHref) && (
          <div className="flex flex-col gap-2 shrink-0 ml-1">
            {onAddClick && (
              <button type="button" onClick={onAddClick} className={`rounded-full border flex items-center justify-center h-6 w-6 sm:h-8 sm:w-8 transition ${colorClass}`}>
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </button>
            )}
            {viewHref && (
              <Link href={viewHref} className={`rounded-full border flex items-center justify-center h-6 w-6 sm:h-8 sm:w-8 transition ${colorClass}`}>
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </Link>
            )}
          </div>
        )}
      </div>
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
          {/* <p className="text-xs uppercase tracking-[0.2em] text-teal-700 sm:text-sm sm:tracking-[0.25em]">Mix</p> */}
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
  id,
  children,
}: {
  title: string;
  subtitle: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <div id={id} className="min-w-0 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-5 scroll-mt-24">
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
      {href ? (
        <Link
          href={href}
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

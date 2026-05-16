"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import type { FormEvent } from "react";
import { useMemo, useState, useEffect } from "react";
import { Loader } from "@/components/ui/Loader";

import { uploadReceipt } from "@/lib/api";
import type { IncomeItem } from "@/lib/types";
import {
  useDeleteIncomeMutation,
  useGetIncomeQuery,
  useUpdateIncomeMutation,
} from "@/store/services/incomeApi";

function currency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function IncomesPageClient() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [openIncomeId, setOpenIncomeId] = useState<string | null>(null);
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  const [uploadingIncomeId, setUploadingIncomeId] = useState<string | null>(null);
  const [incomeError, setIncomeError] = useState("");
  const [selectedSource, setSelectedSource] = useState("All");
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [amountSort, setAmountSort] = useState<"asc" | "desc">("desc");

  const incomesQuery = useGetIncomeQuery({ token: token || "" }, { skip: !token });
  const [updateIncome, updateIncomeMutation] = useUpdateIncomeMutation();
  const [deleteIncome, deleteIncomeMutation] = useDeleteIncomeMutation();
  const incomes = incomesQuery.data?.income || [];

  const sources = useMemo(
    () => ["All", ...new Set(incomes.map((income) => income.source).filter(Boolean))],
    [incomes]
  );

  const months = useMemo(
    () => [
      "All",
      ...new Set(
        incomes.map((income) => {
          const date = new Date(income.date);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          return `${year}-${month}`;
        })
      ),
    ],
    [incomes]
  );

  const filteredIncomes = useMemo(() => {
    return [...incomes]
      .filter((income) => selectedSource === "All" || income.source === selectedSource)
      .filter((income) => {
        if (selectedMonth === "All") {
          return true;
        }

        return getMonthKey(income.date) === selectedMonth;
      })
      .sort((left, right) =>
        amountSort === "asc" ? left.amount - right.amount : right.amount - left.amount
      );
  }, [amountSort, incomes, selectedSource, selectedMonth]);

  function startEditing(income: IncomeItem) {
    setOpenIncomeId(income._id);
    setEditingIncomeId(income._id);
    setIncomeError("");
  }

  async function handleUpdateIncome(event: FormEvent<HTMLFormElement>, income: IncomeItem) {
    event.preventDefault();
    if (!token) return;

    const formData = new FormData(event.currentTarget);
    const receiptFile = formData.get("receipt");
    const payload: {
      token: string;
      id: string;
      amount: number;
      source: string;
      description: string;
      date: string;
      receiptUrl?: string;
    } = {
      token,
      id: income._id,
      amount: Number(formData.get("amount")),
      source: String(formData.get("source")),
      description: String(formData.get("description") || ""),
      date: String(formData.get("date") || formatDateInputValue(income.date)),
    };

    try {
      if (receiptFile instanceof File && receiptFile.size > 0) {
        setUploadingIncomeId(income._id);
        const upload = await uploadReceipt(receiptFile, token);
        payload.receiptUrl = upload.receiptKey;
      }

      await updateIncome(payload).unwrap();
      setIncomeError("");
      setEditingIncomeId(null);
    } catch (error) {
      setIncomeError(error instanceof Error ? error.message : "Unable to update income.");
    } finally {
      setUploadingIncomeId(null);
    }
  }

  async function handleDeleteIncome(income: IncomeItem) {
    if (!token) return;
    const confirmed = window.confirm(`Delete ${income.source} income for ${currency(income.amount)}?`);

    if (!confirmed) {
      return;
    }

    try {
      await deleteIncome({ token, id: income._id }).unwrap();
      setIncomeError("");
      setOpenIncomeId((currentId) => (currentId === income._id ? null : currentId));
      setEditingIncomeId((currentId) => (currentId === income._id ? null : currentId));
    } catch (error) {
      setIncomeError(error instanceof Error ? error.message : "Unable to delete income.");
    }
  }

  const [showTokenError, setShowTokenError] = useState(false);
  useEffect(() => {
    if (!token) {
      const timer = setTimeout(() => setShowTokenError(true), 10000);
      return () => clearTimeout(timer);
    }
  }, [token]);

  if (status === "loading" || (!token && !showTokenError)) {
    return <Loader message="Loading incomes..." />;
  }

  if (!token) {
    return <p className="text-sm text-slate-500 text-center mt-8">Your session is missing a backend token. Sign in again.</p>;
  }

  return (
    <div className="min-w-0 space-y-5 md:space-y-6">
      <div className="flex flex-col gap-4 rounded-[1.5rem] bg-slate-900 px-4 py-5 text-white shadow-[0_30px_80px_rgba(15,23,42,0.2)] sm:rounded-[2rem] sm:px-6 sm:py-6 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="text-xl uppercase tracking-[0.1em] text-teal-300 sm:text-2xl">Incomes</p>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Expand any item to review description, transaction date, document details, and more.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex justify-center rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:border-white/40"
        >
          Back to dashboard
        </Link>
      </div>

      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[1.75rem] sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm uppercase tracking-[0.18em] text-teal-700">Filters</p>
            <p className="mt-2 text-sm text-slate-500">
              Showing {filteredIncomes.length} of {incomes.length} incomes
            </p>
            {incomeError ? <p className="mt-2 text-sm text-rose-600">{incomeError}</p> : null}
          </div>

          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:max-w-2xl">
            <label className="grid gap-2">
              <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Source</span>
              <select
                value={selectedSource}
                onChange={(event) => setSelectedSource(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
              >
                {sources.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Month</span>
              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
              >
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month === "All" ? "All months" : formatMonthLabel(month)}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 col-span-2 sm:col-span-1">
              <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Sort by amount</span>
              <select
                value={amountSort}
                onChange={(event) => setAmountSort(event.target.value as "asc" | "desc")}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
              >
                <option value="desc">High to low</option>
                <option value="asc">Low to high</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredIncomes.map((income) => {
          const isOpen = openIncomeId === income._id;
          const isEditing = editingIncomeId === income._id;

          return (
            <div
              key={income._id}
              className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-col gap-4 px-4 py-4 sm:px-5 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{income.source}</p>
                  <p className="mt-1 break-words text-sm text-slate-500">
                    {income.description || "No description"} - {new Date(income.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap md:justify-end">
                  <div className="mr-auto min-w-0 text-left sm:mr-2 md:text-right">
                    <p className="font-semibold text-slate-900">{currency(income.amount)}</p>
                    <p className="mt-1 text-xs text-slate-500">{isOpen ? "Details open" : "Ready to review"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenIncomeId(isOpen ? null : income._id);
                      setEditingIncomeId(null);
                      setIncomeError("");
                    }}
                    aria-label={isOpen ? "Hide income details" : "View income details"}
                    title={isOpen ? "Hide details" : "View details"}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    {isOpen ? <ChevronUpIcon /> : <EyeIcon />}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEditing(income)}
                    aria-label="Edit income"
                    title="Edit income"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-white transition hover:bg-teal-700"
                  >
                    <PencilIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteIncome(income)}
                    disabled={deleteIncomeMutation.isLoading}
                    aria-label="Delete income"
                    title="Delete income"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>

              {isOpen ? (
                <div className="border-t border-slate-100 px-4 py-5 sm:px-5">
                  {isEditing ? (
                    <form
                      onSubmit={(event) => handleUpdateIncome(event, income)}
                      className="mb-5 rounded-[1.5rem] border border-teal-100 bg-teal-50/60 p-3 sm:p-4"
                    >
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="grid gap-2">
                          <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                            Amount
                          </span>
                          <input
                            name="amount"
                            type="number"
                            step="0.01"
                            defaultValue={income.amount}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
                            required
                          />
                        </label>
                        <label className="grid gap-2">
                          <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                            Source
                          </span>
                          <input
                            name="source"
                            defaultValue={income.source}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
                            required
                          />
                        </label>
                        <label className="grid gap-2 md:col-span-2">
                          <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                            Description
                          </span>
                          <input
                            name="description"
                            defaultValue={income.description}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
                          />
                        </label>
                        <label className="grid gap-2">
                          <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                            Transaction date
                          </span>
                          <input
                            name="date"
                            type="date"
                            defaultValue={formatDateInputValue(income.date)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
                            required
                          />
                        </label>
                        <label className="grid gap-2 md:col-span-2">
                          <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                            Receipt or document
                          </span>
                          <input
                            name="receipt"
                            type="file"
                            accept="image/*,.pdf,.doc,.docx"
                            className="block w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 outline-none"
                          />
                          <span className="text-xs text-slate-500">
                            Upload a new file only if you want to replace the current receipt/document.
                          </span>
                        </label>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="submit"
                          disabled={updateIncomeMutation.isLoading || uploadingIncomeId === income._id}
                          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {uploadingIncomeId === income._id
                            ? "Uploading..."
                            : updateIncomeMutation.isLoading
                              ? "Saving..."
                              : "Save changes"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingIncomeId(null);
                            setIncomeError("");
                          }}
                          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : null}

                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(240px,280px)]">
                    <div className="grid gap-4">
                      <DetailRow label="Source" value={income.source} />
                      <DetailRow label="Amount" value={currency(income.amount)} />
                      <DetailRow label="Description" value={income.description || "No description provided"} />
                      <DetailRow label="Transaction date" value={new Date(income.date).toLocaleString()} />
                      <DetailRow label="Created at" value={new Date(income.createdAt).toLocaleString()} />
                    </div>

                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-medium text-slate-700">Receipt/document</p>
                      {income.receiptUrl ? (
                        <div className="mt-3 space-y-3">
                          {isImageFileUrl(income.receiptUrl) ? (
                            <Image
                              src={income.receiptUrl}
                              alt={`${income.source} receipt`}
                              width={280}
                              height={224}
                              className="h-56 w-full rounded-2xl object-cover"
                            />
                          ) : (
                            <div className="flex h-56 w-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-4 text-center text-sm text-slate-500">
                              Document uploaded
                            </div>
                          )}
                          <a
                            href={income.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                          >
                            Open file
                          </a>
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-slate-500">No receipt or document uploaded for this income.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}

        {filteredIncomes.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm text-slate-500">
            No incomes found for the selected filters.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="m18 15-6-6-6 6" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.86 4.49 2.65 2.65M7.5 19.5l-3 0.75 0.75-3L17.81 4.69a1.88 1.88 0 0 1 2.65 2.65L7.5 19.5Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 7.5h12M9.75 7.5V6A1.5 1.5 0 0 1 11.25 4.5h1.5A1.5 1.5 0 0 1 14.25 6v1.5M9 10.5v6M15 10.5v6M7.5 7.5l0.75 12A1.5 1.5 0 0 0 9.75 21h4.5a1.5 1.5 0 0 0 1.5-1.5l0.75-12" />
    </svg>
  );
}

function getMonthKey(dateString: string) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatMonthLabel(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function formatDateInputValue(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function isImageFileUrl(url: string) {
  const filePath = url.split("?")[0]?.toLowerCase() || "";

  return [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"].some((extension) =>
    filePath.endsWith(extension)
  );
}

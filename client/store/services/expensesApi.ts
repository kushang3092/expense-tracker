import type { ExpenseItem } from "@/lib/types";

import { baseApi } from "./baseApi";

type AuthArg = {
  token: string;
};

type CreateExpenseArg = AuthArg & {
  amount: number;
  category: string;
  description: string;
  date: string;
  receiptUrl?: string;
};

type UpdateExpenseArg = CreateExpenseArg & {
  id: string;
};

type DeleteExpenseArg = AuthArg & {
  id: string;
};

export const expensesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getExpenses: builder.query<{ expenses: ExpenseItem[] }, AuthArg>({
      query: ({ token }) => ({
        url: "/api/expenses",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      providesTags: ["Expenses"],
    }),
    createExpense: builder.mutation<{ expense: ExpenseItem }, CreateExpenseArg>({
      query: ({ token, ...body }) => ({
        url: "/api/expenses",
        method: "POST",
        body,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }),
      invalidatesTags: ["Analytics", "Expenses", "Budgets"],
    }),
    updateExpense: builder.mutation<{ expense: ExpenseItem }, UpdateExpenseArg>({
      query: ({ token, id, ...body }) => ({
        url: `/api/expenses/${id}`,
        method: "PUT",
        body,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }),
      invalidatesTags: ["Analytics", "Expenses", "Budgets"],
    }),
    deleteExpense: builder.mutation<{ message: string }, DeleteExpenseArg>({
      query: ({ token, id }) => ({
        url: `/api/expenses/${id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      invalidatesTags: ["Analytics", "Expenses", "Budgets"],
    }),
  }),
});

export const {
  useCreateExpenseMutation,
  useDeleteExpenseMutation,
  useGetExpensesQuery,
  useUpdateExpenseMutation,
} = expensesApi;

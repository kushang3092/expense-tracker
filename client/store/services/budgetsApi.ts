import type { BudgetItem } from "@/lib/types";

import { baseApi } from "./baseApi";

type AuthArg = {
  token: string;
};

type CreateBudgetArg = AuthArg & {
  category: string;
  limit: number;
  month: string;
};

export const budgetsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBudgets: builder.query<{ budgets: BudgetItem[] }, AuthArg>({
      query: ({ token }) => ({
        url: "/api/budgets",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      providesTags: ["Budgets"],
    }),
    createBudget: builder.mutation<{ budget: BudgetItem }, CreateBudgetArg>({
      query: ({ token, ...body }) => ({
        url: "/api/budgets",
        method: "POST",
        body,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }),
      invalidatesTags: ["Analytics", "Budgets"],
    }),
  }),
});

export const { useCreateBudgetMutation, useGetBudgetsQuery } = budgetsApi;

import type { IncomeItem } from "@/lib/types";

import { baseApi } from "./baseApi";

type AuthArg = {
  token: string;
};

type CreateIncomeArg = AuthArg & {
  amount: number;
  source: string;
  description: string;
  date: string;
  receiptUrl?: string;
};

type UpdateIncomeArg = CreateIncomeArg & {
  id: string;
};

type DeleteIncomeArg = AuthArg & {
  id: string;
};

export const incomeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getIncome: builder.query<{ income: IncomeItem[] }, AuthArg>({
      query: ({ token }) => ({
        url: "/api/income",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      providesTags: ["Income"],
    }),
    createIncome: builder.mutation<{ income: IncomeItem }, CreateIncomeArg>({
      query: ({ token, ...body }) => ({
        url: "/api/income",
        method: "POST",
        body,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }),
      invalidatesTags: ["Analytics", "Income"],
    }),
    updateIncome: builder.mutation<{ income: IncomeItem }, UpdateIncomeArg>({
      query: ({ token, id, ...body }) => ({
        url: `/api/income/${id}`,
        method: "PUT",
        body,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }),
      invalidatesTags: ["Analytics", "Income"],
    }),
    deleteIncome: builder.mutation<{ message: string }, DeleteIncomeArg>({
      query: ({ token, id }) => ({
        url: `/api/income/${id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      invalidatesTags: ["Analytics", "Income"],
    }),
  }),
});

export const {
  useCreateIncomeMutation,
  useDeleteIncomeMutation,
  useGetIncomeQuery,
  useUpdateIncomeMutation,
} = incomeApi;

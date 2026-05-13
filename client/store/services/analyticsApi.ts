import type {
  AnalyticsResponse,
  CategoryDistributionResponse,
  IncomeSourceDistributionResponse,
} from "@/lib/types";

import { baseApi } from "./baseApi";

type AuthArg = {
  token: string;
};

type CategoryDistributionArg = AuthArg & {
  month: string;
};

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAnalytics: builder.query<AnalyticsResponse, AuthArg>({
      query: ({ token }) => ({
        url: "/api/analytics/summary",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      providesTags: ["Analytics"],
    }),
    getCategoryDistribution: builder.query<CategoryDistributionResponse, CategoryDistributionArg>({
      query: ({ token, month }) => ({
        url: `/api/analytics/category-distribution?month=${encodeURIComponent(month)}`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      providesTags: ["Analytics"],
    }),
    getIncomeSourceDistribution: builder.query<IncomeSourceDistributionResponse, CategoryDistributionArg>({
      query: ({ token, month }) => ({
        url: `/api/analytics/income-source-distribution?month=${encodeURIComponent(month)}`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      providesTags: ["Analytics"],
    }),
  }),
});

export const {
  useGetAnalyticsQuery,
  useGetCategoryDistributionQuery,
  useGetIncomeSourceDistributionQuery,
} = analyticsApi;

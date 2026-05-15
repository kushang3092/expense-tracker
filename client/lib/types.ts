export type Overview = {
  currentExpenseTotal: number;
  currentIncomeTotal: number;
  savingsRate: number;
  expenseChange: number;
};

export type MonthlySpendingPoint = {
  month: string;
  label: string;
  spending: number;
};

export type CategoryPoint = {
  name: string;
  value: number;
};

export type MonthOption = {
  value: string;
  label: string;
};

export type BudgetItem = {
  _id: string;
  userId: string;
  category: string;
  limit: number;
  month: string;
  spent?: number;
  remaining?: number;
};

export type ExpenseItem = {
  _id: string;
  userId: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  receiptUrl?: string | null;
  createdAt: string;
};

export type IncomeItem = {
  _id: string;
  userId: string;
  amount: number;
  source: string;
  description: string;
  date: string;
  receiptUrl?: string | null;
  createdAt: string;
};

export type AnalyticsResponse = {
  overview: Overview;
  charts: {
    monthlySpending: MonthlySpendingPoint[];
    categoryDistribution: CategoryPoint[];
    incomeSourceDistribution: CategoryPoint[];
  };
  budgets: BudgetItem[];
  insights: string[];
};

export type CategoryDistributionResponse = {
  month: string;
  label: string;
  distribution: CategoryPoint[];
  availableMonths: MonthOption[];
};

export type IncomeSourceDistributionResponse = CategoryDistributionResponse;

function getMonthKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

function getMonthLabel(monthKey) {
  const [year, month] = monthKey.split("-").map(Number)
  return new Date(year, month - 1, 1).toLocaleString("en-US", {
    month: "short",
    year: "numeric",
  })
}

function buildMonthSeries(length = 6) {
  const months = []
  const today = new Date()

  for (let offset = length - 1; offset >= 0; offset -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth() - offset, 1)
    months.push(getMonthKey(date))
  }

  return months
}

function sumAmounts(items) {
  return items.reduce((total, item) => total + Number(item.amount || 0), 0)
}

function buildCategoryTotals(expenses) {
  const totals = new Map()

  expenses.forEach((expense) => {
    const key = expense.category || "Other"
    totals.set(key, (totals.get(key) || 0) + Number(expense.amount || 0))
  })

  return Array.from(totals.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((left, right) => right.value - left.value)
}

function buildIncomeSourceTotals(income) {
  const totals = new Map()

  income.forEach((entry) => {
    const key = entry.source || "Other"
    totals.set(key, (totals.get(key) || 0) + Number(entry.amount || 0))
  })

  return Array.from(totals.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((left, right) => right.value - left.value)
}

function buildMonthlySpending(expenses, months) {
  return months.map((monthKey) => ({
    month: monthKey,
    label: getMonthLabel(monthKey),
    spending: expenses
      .filter((expense) => getMonthKey(new Date(expense.date)) === monthKey)
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
  }))
}

function calculateSavingsRate(incomeTotal, expenseTotal) {
  if (!incomeTotal) {
    return 0
  }

  return Number((((incomeTotal - expenseTotal) / incomeTotal) * 100).toFixed(1))
}

function buildInsights({ currentExpenseTotal, previousExpenseTotal, topCategory, savingsRate }) {
  const insights = []

  if (previousExpenseTotal > 0 && currentExpenseTotal > previousExpenseTotal) {
    const growth = (((currentExpenseTotal - previousExpenseTotal) / previousExpenseTotal) * 100).toFixed(0)
    insights.push(`You spent around ${growth}% more this month than last month.`)
  }

  if (topCategory) {
    insights.push(`${topCategory.name} is your biggest expense category this month.`)
  }

  insights.push(
    savingsRate < 20
      ? "Your savings rate is below 20%. Review discretionary spending and budget limits."
      : "Your savings rate is healthy this month. Keep the momentum going."
  )

  return insights
}

module.exports = {
  buildCategoryTotals,
  buildIncomeSourceTotals,
  buildInsights,
  buildMonthSeries,
  buildMonthlySpending,
  calculateSavingsRate,
  getMonthKey,
  getMonthLabel,
  sumAmounts,
}

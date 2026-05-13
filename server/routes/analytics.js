const express = require("express")

const Budget = require("../models/Budget")
const Expense = require("../models/Expense")
const Income = require("../schemas/Income")
const { protect } = require("../middleware/auth")
const {
  buildCategoryTotals,
  buildIncomeSourceTotals,
  buildInsights,
  buildMonthSeries,
  buildMonthlySpending,
  calculateSavingsRate,
  getMonthKey,
  getMonthLabel,
  sumAmounts,
} = require("../utils/analytics")

const router = express.Router()

router.use(protect)

router.get("/category-distribution", async (req, res) => {
  const months = buildMonthSeries(6)
  const requestedMonth = typeof req.query.month === "string" ? req.query.month : ""
  const selectedMonth = months.includes(requestedMonth) ? requestedMonth : months[months.length - 1]

  const expenses = await Expense.find({ userId: req.user.id }).lean()
  const selectedMonthExpenses = expenses.filter(
    (expense) => getMonthKey(new Date(expense.date)) === selectedMonth
  )

  res.json({
    month: selectedMonth,
    label: getMonthLabel(selectedMonth),
    distribution: buildCategoryTotals(selectedMonthExpenses),
    availableMonths: months.map((month) => ({
      value: month,
      label: getMonthLabel(month),
    })),
  })
})

router.get("/income-source-distribution", async (req, res) => {
  const months = buildMonthSeries(6)
  const requestedMonth = typeof req.query.month === "string" ? req.query.month : ""
  const selectedMonth = months.includes(requestedMonth) ? requestedMonth : months[months.length - 1]

  const income = await Income.find({ userId: req.user.id }).lean()
  const selectedMonthIncome = income.filter(
    (entry) => getMonthKey(new Date(entry.date)) === selectedMonth
  )

  res.json({
    month: selectedMonth,
    label: getMonthLabel(selectedMonth),
    distribution: buildIncomeSourceTotals(selectedMonthIncome),
    availableMonths: months.map((month) => ({
      value: month,
      label: getMonthLabel(month),
    })),
  })
})

router.get("/summary", async (req, res) => {
  const [expenses, income, budgets] = await Promise.all([
    Expense.find({ userId: req.user.id }).lean(),
    Income.find({ userId: req.user.id }).lean(),
    Budget.find({ userId: req.user.id }).lean(),
  ])

  const months = buildMonthSeries(6)
  const currentMonth = months[months.length - 1]
  const previousMonth = months[months.length - 2]

  const currentMonthExpenses = expenses.filter((expense) => getMonthKey(new Date(expense.date)) === currentMonth)
  const previousMonthExpenses = expenses.filter((expense) => getMonthKey(new Date(expense.date)) === previousMonth)
  const currentMonthIncome = income.filter((entry) => getMonthKey(new Date(entry.date)) === currentMonth)

  const currentExpenseTotal = sumAmounts(currentMonthExpenses)
  const previousExpenseTotal = sumAmounts(previousMonthExpenses)
  const currentIncomeTotal = sumAmounts(currentMonthIncome)
  const categoryTotals = buildCategoryTotals(currentMonthExpenses)
  const incomeSourceTotals = buildIncomeSourceTotals(currentMonthIncome)
  const monthlySpending = buildMonthlySpending(expenses, months)
  const savingsRate = calculateSavingsRate(currentIncomeTotal, currentExpenseTotal)

  const budgetStatus = budgets.map((budget) => {
    const spent = currentMonthExpenses
      .filter((expense) => expense.category === budget.category && budget.month === currentMonth)
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0)

    return {
      ...budget,
      spent,
      remaining: Number(budget.limit || 0) - spent,
    }
  })

  res.json({
    overview: {
      currentExpenseTotal,
      currentIncomeTotal,
      savingsRate,
      expenseChange: previousExpenseTotal
        ? Number((((currentExpenseTotal - previousExpenseTotal) / previousExpenseTotal) * 100).toFixed(1))
        : 0,
    },
    charts: {
      monthlySpending,
      categoryDistribution: categoryTotals,
      incomeSourceDistribution: incomeSourceTotals,
    },
    budgets: budgetStatus,
    insights: buildInsights({
      currentExpenseTotal,
      previousExpenseTotal,
      topCategory: categoryTotals[0],
      savingsRate,
    }),
  })
})

module.exports = router

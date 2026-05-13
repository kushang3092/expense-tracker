const express = require("express")

const Expense = require("../models/Expense")
const { protect } = require("../middleware/auth")
const { getSignedReceiptUrl } = require("../utils/s3")

const router = express.Router()

router.use(protect)

router.get("/", async (req, res) => {
  const expenses = await Expense.find({ userId: req.user.id }).sort({ date: -1, createdAt: -1 }).lean()
  const serializedExpenses = await Promise.all(
    expenses.map(async (expense) => ({
      ...expense,
      receiptUrl: expense.receiptUrl ? await getSignedReceiptUrl(expense.receiptUrl) : null,
    }))
  )

  res.json({ expenses: serializedExpenses })
})

router.post("/", async (req, res) => {
  const { amount, category, description, date, receiptUrl } = req.body

  if (amount === undefined || amount === null || !category) {
    return res.status(400).json({ message: "Amount and category are required." })
  }

  const expense = await Expense.create({
    userId: req.user.id,
    amount,
    category,
    description,
    date,
    receiptUrl,
  })

  return res.status(201).json({ expense })
})

router.put("/:id", async (req, res) => {
  const { amount, category, description, date, receiptUrl } = req.body

  if (amount === undefined || amount === null || !category) {
    return res.status(400).json({ message: "Amount and category are required." })
  }

  const expense = await Expense.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { amount, category, description, date, ...(receiptUrl !== undefined ? { receiptUrl } : {}) },
    { new: true, runValidators: true }
  )

  if (!expense) {
    return res.status(404).json({ message: "Expense not found." })
  }

  return res.json({ expense })
})

router.delete("/:id", async (req, res) => {
  const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user.id })

  if (!expense) {
    return res.status(404).json({ message: "Expense not found." })
  }

  return res.json({ message: "Expense deleted." })
})

module.exports = router

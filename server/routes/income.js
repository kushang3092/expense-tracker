const express = require("express")

const Income = require("../schemas/Income")
const { protect } = require("../middleware/auth")
const { getSignedReceiptUrl } = require("../utils/s3")

const router = express.Router()

router.use(protect)

router.get("/", async (req, res) => {
  const income = await Income.find({ userId: req.user.id }).sort({ date: -1, createdAt: -1 }).lean()
  const serializedIncome = await Promise.all(
    income.map(async (item) => ({
      ...item,
      receiptUrl: item.receiptUrl ? await getSignedReceiptUrl(item.receiptUrl) : null,
    }))
  )

  res.json({ income: serializedIncome })
})

router.post("/", async (req, res) => {
  const { amount, source, description, date, receiptUrl } = req.body

  if (amount === undefined || amount === null || !source) {
    return res.status(400).json({ message: "Amount and source are required." })
  }

  const income = await Income.create({
    userId: req.user.id,
    amount,
    source,
    description,
    date,
    receiptUrl,
  })

  return res.status(201).json({ income })
})

router.put("/:id", async (req, res) => {
  const income = await Income.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    req.body,
    { new: true, runValidators: true }
  )

  if (!income) {
    return res.status(404).json({ message: "Income record not found." })
  }

  return res.json({ income })
})

router.delete("/:id", async (req, res) => {
  const income = await Income.findOneAndDelete({ _id: req.params.id, userId: req.user.id })

  if (!income) {
    return res.status(404).json({ message: "Income record not found." })
  }

  return res.json({ message: "Income deleted." })
})

module.exports = router

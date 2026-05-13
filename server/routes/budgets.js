const express = require("express")

const Budget = require("../models/Budget")
const { protect } = require("../middleware/auth")

const router = express.Router()

router.use(protect)

router.get("/", async (req, res) => {
  const budgets = await Budget.find({ userId: req.user.id }).sort({ month: -1, category: 1 })
  res.json({ budgets })
})

router.post("/", async (req, res) => {
  const { category, limit, month } = req.body

  if (!category || limit === undefined || limit === null || !month) {
    return res.status(400).json({ message: "Category, limit, and month are required." })
  }

  const budget = await Budget.findOneAndUpdate(
    { userId: req.user.id, category, month },
    { limit },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  )

  return res.status(201).json({ budget })
})

router.put("/:id", async (req, res) => {
  const budget = await Budget.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    req.body,
    { new: true, runValidators: true }
  )

  if (!budget) {
    return res.status(404).json({ message: "Budget not found." })
  }

  return res.json({ budget })
})

router.delete("/:id", async (req, res) => {
  const budget = await Budget.findOneAndDelete({ _id: req.params.id, userId: req.user.id })

  if (!budget) {
    return res.status(404).json({ message: "Budget not found." })
  }

  return res.json({ message: "Budget deleted." })
})

module.exports = router

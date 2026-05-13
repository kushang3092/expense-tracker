const mongoose = require("mongoose")

const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      trim: true,
       enum: [
        "Food",
        "Transport",
        "Shopping",
        "Bills",
        "Rent",
        "Entertainment",
        "Health",
        "Travel",
        "Other"
      ]
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    receiptUrl: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

expenseSchema.index({ userId: 1, date: -1 })

module.exports = mongoose.model("Expense", expenseSchema)

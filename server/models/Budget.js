const mongoose = require("mongoose")

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
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
        "Other"
      ]
    },
    limit: {
      type: Number,
      required: true,
      min: 0,
    },
    month: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"],
    },
  },
  {
    versionKey: false,
  }
)

budgetSchema.index({ userId: 1, category: 1, month: 1 }, { unique: true })

module.exports = mongoose.model("Budget", budgetSchema)

require("dotenv").config()
const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")

const connectDB = require("./config/db")
const analyticsRoutes = require("./routes/analytics")
const authRoutes = require("./routes/auth")
const budgetRoutes = require("./routes/budgets")
const expenseRoutes = require("./routes/expenses")
const incomeRoutes = require("./routes/income")
const uploadRoutes = require("./routes/uploads")

const app = express()
const PORT = process.env.PORT || 5000

app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true,
  })
)
app.use(express.json())

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    mongoState: mongoose.connection.readyState,
  })
})

app.use("/api/auth", authRoutes)
app.use("/api/expenses", expenseRoutes)
app.use("/api/income", incomeRoutes)
app.use("/api/budgets", budgetRoutes)
app.use("/api/analytics", analyticsRoutes)
app.use("/api/uploads", uploadRoutes)

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch((error) => {
    console.error("MongoDB connection failed", error)
    process.exit(1)
  })

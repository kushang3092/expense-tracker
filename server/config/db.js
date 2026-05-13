const mongoose = require("mongoose")

let isConnected = false

async function connectDB() {
  if (isConnected) {
    return mongoose.connection
  }

  const mongoUri = process.env.MONGO_URI

  if (!mongoUri) {
    throw new Error("MONGO_URI is not defined")
  }

  await mongoose.connect(mongoUri)
  isConnected = true

  return mongoose.connection
}

module.exports = connectDB

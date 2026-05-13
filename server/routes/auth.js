const express = require("express")
const bcrypt = require("bcrypt")

const User = require("../models/User")
const { protect } = require("../middleware/auth")
const generateToken = require("../utils/generateToken")

const router = express.Router()

function serializeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    provider: user.provider,
    avatar: user.avatar,
    createdAt: user.createdAt,
  }
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." })
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(409).json({ message: "A user with this email already exists." })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      provider: "local",
    })

    return res.status(201).json({
      user: serializeUser(user),
      token: generateToken(user),
    })
  } catch (error) {
    console.log("error",error);
    
    return res.status(500).json({ message: "Unable to register user." })
  }
})

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." })
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid email or password." })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." })
    }

    return res.json({
      user: serializeUser(user),
      token: generateToken(user),
    })
  } catch (error) {
    return res.status(500).json({ message: "Unable to log in." })
  }
})

router.post("/google", async (req, res) => {
  try {
    const { name, email, avatar } = req.body

    if (!email) {
      return res.status(400).json({ message: "Email is required for Google sign-in." })
    }

    let user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      user = await User.create({
        name: name || email.split("@")[0],
        email,
        provider: "google",
        avatar: avatar || null,
      })
    } else {
      user.name = name || user.name
      user.avatar = avatar || user.avatar
      user.provider = "google"
      await user.save()
    }

    return res.json({
      user: serializeUser(user),
      token: generateToken(user),
    })
  } catch (error) {
    return res.status(500).json({ message: "Unable to sync Google account." })
  }
})

router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({ message: "User not found." })
    }

    return res.json({ user: serializeUser(user) })
  } catch (error) {
    return res.status(500).json({ message: "Unable to load user profile." })
  }
})

module.exports = router

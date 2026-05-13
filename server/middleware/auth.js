const jwt = require("jsonwebtoken")

function protect(req, res, next) {
  const authHeader = req.headers.authorization || ""
  const [scheme, token] = authHeader.split(" ")

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    return next()
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" })
  }
}

module.exports = { protect }

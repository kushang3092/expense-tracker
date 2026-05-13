const express = require("express")
const crypto = require("crypto")
const multer = require("multer")

const { protect } = require("../middleware/auth")
const { createS3Client, getS3Config, getSignedReceiptUrl } = require("../utils/s3")
const { PutObjectCommand } = require("@aws-sdk/client-s3")

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

router.post("/receipt", protect, upload.single("receipt"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Receipt image is required." })
  }

  let client
  let AWS_S3_BUCKET

  try {
    client = createS3Client()
    AWS_S3_BUCKET = getS3Config().AWS_S3_BUCKET
  } catch (error) {
    return res.status(503).json({ message: "AWS S3 environment variables are not configured." })
  }

  const fileExtension = (req.file.originalname.split(".").pop() || "jpg").toLowerCase()
  const key = `receipts/${req.user.id}/${Date.now()}-${crypto.randomUUID()}.${fileExtension}`

  await client.send(
    new PutObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    })
  )

  const signedReceiptUrl = await getSignedReceiptUrl(key)

  return res.status(201).json({
    receiptKey: key,
    receiptUrl: signedReceiptUrl,
  })
})

module.exports = router

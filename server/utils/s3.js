const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3")
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner")

function getS3Config() {
  const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET } = process.env

  if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_S3_BUCKET) {
    throw new Error("AWS S3 environment variables are not configured.")
  }

  return { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET }
}

function createS3Client() {
  const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = getS3Config()

  return new S3Client({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  })
}

function getReceiptKey(receiptValue) {
  if (!receiptValue) {
    return null
  }

  if (receiptValue.startsWith("receipts/")) {
    return receiptValue
  }

  try {
    const url = new URL(receiptValue)
    return decodeURIComponent(url.pathname.replace(/^\/+/, ""))
  } catch (error) {
    return receiptValue
  }
}

async function getSignedReceiptUrl(receiptValue, expiresIn = 3600) {
  const key = getReceiptKey(receiptValue)

  if (!key) {
    return null
  }

  const client = createS3Client()
  const { AWS_S3_BUCKET } = getS3Config()

  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: key,
    }),
    { expiresIn }
  )
}

module.exports = {
  createS3Client,
  getReceiptKey,
  getS3Config,
  getSignedReceiptUrl,
}

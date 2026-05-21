const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const awsConfig = require('../config/aws')

const s3 = new S3Client(awsConfig)

async function generateUploadUrl(userId, imageId, filename, contentType) {
  const key = `uploads/${userId}/${imageId}/${filename}`
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  })
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 })
  return { uploadUrl, key }
}

async function getImageUrl(key) {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  })
  return getSignedUrl(s3, command, { expiresIn: 3600 })
}

module.exports = { generateUploadUrl, getImageUrl }

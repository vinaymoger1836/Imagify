const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3')
const sharp = require('sharp')
const crypto = require('crypto')

const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' })

async function streamToBuffer(stream) {
  const chunks = []
  for await (const chunk of stream) chunks.push(chunk)
  return Buffer.concat(chunks)
}

async function generateDerivatives(bucket, key) {
  const { Body } = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
  const original = await streamToBuffer(Body)

  const fileHash = crypto.createHash('sha256').update(original).digest('hex')
  // Key format: uploads/{userId}/{imageId}/{filename}
  // Derivatives go under derivatives/ prefix so S3 notification (uploads/ only) doesn't re-trigger Lambda
  const parts = key.split('/')
  const derivativeBase = `derivatives/${parts[1]}/${parts[2]}`

  const [thumbBuffer, mediumBuffer] = await Promise.all([
    sharp(original).resize(200, 200, { fit: 'cover' }).webp({ quality: 80 }).toBuffer(),
    sharp(original).resize(800, null, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer(),
  ])

  await Promise.all([
    s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: `${derivativeBase}/thumb.webp`,
      Body: thumbBuffer,
      ContentType: 'image/webp',
    })),
    s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: `${derivativeBase}/medium.webp`,
      Body: mediumBuffer,
      ContentType: 'image/webp',
    })),
  ])

  return fileHash
}

module.exports = { generateDerivatives }

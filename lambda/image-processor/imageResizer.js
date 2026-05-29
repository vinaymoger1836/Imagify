const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3')
const sharp = require('sharp')

const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' })

async function streamToBuffer(stream) {
  const chunks = []
  for await (const chunk of stream) chunks.push(chunk)
  return Buffer.concat(chunks)
}

async function generateDerivatives(bucket, key) {
  const { Body } = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
  const original = await streamToBuffer(Body)
  const basePath = key.substring(0, key.lastIndexOf('/'))

  const [thumbBuffer, mediumBuffer] = await Promise.all([
    sharp(original).resize(200, 200, { fit: 'cover' }).webp({ quality: 80 }).toBuffer(),
    sharp(original).resize(800, null, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer(),
  ])

  await Promise.all([
    s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: `${basePath}/thumb.webp`,
      Body: thumbBuffer,
      ContentType: 'image/webp',
    })),
    s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: `${basePath}/medium.webp`,
      Body: mediumBuffer,
      ContentType: 'image/webp',
    })),
  ])
}

module.exports = { generateDerivatives }

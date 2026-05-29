const { processImage } = require('./rekognition')
const { saveLabels } = require('./dynamodb')
const { generateDerivatives } = require('./imageResizer')

exports.handler = async (event) => {
  const failures = []

  for (const sqsRecord of event.Records) {
    try {
      const s3Event = JSON.parse(sqsRecord.body)
      const s3Record = s3Event.Records[0]
      const bucket = s3Record.s3.bucket.name
      const key = decodeURIComponent(s3Record.s3.object.key.replace(/\+/g, ' '))
      // Key format: uploads/{userId}/{imageId}/{filename}
      const parts = key.split('/')
      const userId   = parts[1]
      const imageId  = parts[2]
      const filename = parts[3]

      const [labels, fileHash] = await Promise.all([
        processImage(bucket, key),
        generateDerivatives(bucket, key),
      ])

      await saveLabels(userId, imageId, filename, key, labels, fileHash)
    } catch (err) {
      console.error('Failed to process record', sqsRecord.messageId, err)
      failures.push({ itemIdentifier: sqsRecord.messageId })
    }
  }

  return { batchItemFailures: failures }
}

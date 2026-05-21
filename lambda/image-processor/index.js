const { processImage } = require('./rekognition')
const { saveLabels } = require('./dynamodb')

exports.handler = async (event) => {
  const record = event.Records[0]
  const bucket = record.s3.bucket.name
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '))
  console.log('[lambda] triggered — bucket:', bucket, 'key:', key)

  // Key format: uploads/{userId}/{imageId}/{filename}
  const parts = key.split('/')
  const userId   = parts[1]
  const imageId  = parts[2]
  const filename = parts[3]
  console.log('[lambda] parsed — userId:', userId, 'imageId:', imageId, 'filename:', filename)

  const labels = await processImage(bucket, key)
  console.log('[lambda] rekognition labels:', labels.length)

  await saveLabels(userId, imageId, filename, key, labels)
  console.log('[lambda] saved to DynamoDB')
}

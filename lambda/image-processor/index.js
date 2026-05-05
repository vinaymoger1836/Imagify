const { processImage } = require('./rekognition')
const { saveLabels } = require('./dynamodb')

exports.handler = async (event) => {
  const record = event.Records[0]
  const bucket = record.s3.bucket.name
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '))

  // Key format: uploads/{imageId}/{filename}
  const parts = key.split('/')
  const imageId = parts[1]
  const filename = parts[2]

  console.log(`Processing: bucket=${bucket} key=${key} imageId=${imageId}`)

  const labels = await processImage(bucket, key)
  await saveLabels(imageId, filename, key, labels)

  console.log(`Stored ${labels.length} labels for imageId=${imageId}`)
}

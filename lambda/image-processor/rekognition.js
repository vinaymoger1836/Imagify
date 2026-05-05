const { RekognitionClient, DetectLabelsCommand } = require('@aws-sdk/client-rekognition')

const rekognition = new RekognitionClient({ region: process.env.AWS_REGION || 'us-east-1' })

async function processImage(bucket, key) {
  const result = await rekognition.send(new DetectLabelsCommand({
    Image: {
      S3Object: { Bucket: bucket, Name: key },
    },
    MaxLabels: 10,
    MinConfidence: 70,
  }))

  return result.Labels.map(label => ({
    name: label.Name,
    confidence: label.Confidence,
  }))
}

module.exports = { processImage }

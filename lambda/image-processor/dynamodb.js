const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb')

const dynamo = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' })
)

async function saveLabels(userId, imageId, filename, s3Key, labels) {
  await dynamo.send(new PutCommand({
    TableName: process.env.DYNAMODB_TABLE_NAME,
    Item: {
      imageId,
      userId,
      filename,
      s3Key,
      labels,
      processedAt: new Date().toISOString(),
    },
  }))
}

module.exports = { saveLabels }

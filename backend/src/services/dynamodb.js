const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, GetCommand, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb')
const awsConfig = require('../config/aws')

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient(awsConfig))

async function getLabels(imageId) {
  const result = await dynamo.send(new GetCommand({
    TableName: process.env.DYNAMODB_TABLE_NAME,
    Key: { imageId },
  }))
  return result.Item?.labels || []
}

async function scanImages() {
  const result = await dynamo.send(new ScanCommand({
    TableName: process.env.DYNAMODB_TABLE_NAME,
  }))
  return result.Items || []
}

async function queryByUser(userId) {
  const result = await dynamo.send(new QueryCommand({
    TableName: process.env.DYNAMODB_TABLE_NAME,
    IndexName: 'userId-processedAt-index',
    KeyConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: { ':uid': userId },
    ScanIndexForward: false,
  }))
  return result.Items || []
}

module.exports = { getLabels, scanImages, queryByUser }

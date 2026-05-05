const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, GetCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb')
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

module.exports = { getLabels, scanImages }

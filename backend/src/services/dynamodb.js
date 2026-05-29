const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, GetCommand, ScanCommand, QueryCommand, DeleteCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb')
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

async function getImage(imageId) {
  const result = await dynamo.send(new GetCommand({
    TableName: process.env.DYNAMODB_TABLE_NAME,
    Key: { imageId },
  }))
  return result.Item || null
}

async function deleteImage(imageId) {
  await dynamo.send(new DeleteCommand({
    TableName: process.env.DYNAMODB_TABLE_NAME,
    Key: { imageId },
  }))
}

async function incrementDownloads(imageId) {
  await dynamo.send(new UpdateCommand({
    TableName: process.env.DYNAMODB_TABLE_NAME,
    Key: { imageId },
    UpdateExpression: 'ADD downloadCount :one',
    ExpressionAttributeValues: { ':one': 1 },
  }))
}

async function findByHash(fileHash) {
  const result = await dynamo.send(new QueryCommand({
    TableName: process.env.DYNAMODB_TABLE_NAME,
    IndexName: 'fileHash-index',
    KeyConditionExpression: 'fileHash = :h',
    ExpressionAttributeValues: { ':h': fileHash },
    Limit: 1,
  }))
  return result.Items?.[0] || null
}

module.exports = { getLabels, scanImages, queryByUser, getImage, deleteImage, incrementDownloads, findByHash }

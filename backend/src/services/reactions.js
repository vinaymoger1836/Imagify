const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, PutCommand, DeleteCommand, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb')
const awsConfig = require('../config/aws')

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient(awsConfig))
const TABLE = process.env.REACTIONS_TABLE_NAME

async function setReaction(imageId, userId, type) {
  await dynamo.send(new PutCommand({
    TableName: TABLE,
    Item: { imageId, userId, type, createdAt: new Date().toISOString() },
  }))
}

async function removeReaction(imageId, userId) {
  await dynamo.send(new DeleteCommand({
    TableName: TABLE,
    Key: { imageId, userId },
  }))
}

async function getUserReaction(imageId, userId) {
  const result = await dynamo.send(new GetCommand({
    TableName: TABLE,
    Key: { imageId, userId },
  }))
  return result.Item?.type || null
}

async function getReactionCounts(imageId) {
  const result = await dynamo.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'imageId = :iid',
    ExpressionAttributeValues: { ':iid': imageId },
  }))
  const items = result.Items || []
  return {
    likes: items.filter(i => i.type === 'like').length,
    dislikes: items.filter(i => i.type === 'dislike').length,
  }
}

module.exports = { setReaction, removeReaction, getUserReaction, getReactionCounts }

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const {
  DynamoDBDocumentClient, PutCommand, DeleteCommand, GetCommand,
  QueryCommand, BatchWriteCommand, BatchGetCommand, UpdateCommand,
} = require('@aws-sdk/lib-dynamodb')
const awsConfig = require('../config/aws')

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient(awsConfig))
const TABLE = process.env.REACTIONS_TABLE_NAME
const LABELS_TABLE = process.env.DYNAMODB_TABLE_NAME
const COUNT_ATTR = { like: 'likeCount', dislike: 'dislikeCount' }

function normalizeCounts(item) {
  return {
    likes: Math.max(0, item?.likeCount || 0),
    dislikes: Math.max(0, item?.dislikeCount || 0),
  }
}

async function readCounts(imageId) {
  const result = await dynamo.send(new GetCommand({
    TableName: LABELS_TABLE,
    Key: { imageId },
    ProjectionExpression: 'likeCount, dislikeCount',
  }))
  return normalizeCounts(result.Item)
}

async function adjustCounts(imageId, deltas) {
  const entries = Object.entries(deltas).filter(([, v]) => v !== 0)
  if (entries.length === 0) return readCounts(imageId)
  const values = {}
  const clauses = entries.map(([type], i) => {
    values[`:d${i}`] = deltas[type]
    return `${COUNT_ATTR[type]} :d${i}`
  })
  const result = await dynamo.send(new UpdateCommand({
    TableName: LABELS_TABLE,
    Key: { imageId },
    UpdateExpression: `ADD ${clauses.join(', ')}`,
    ExpressionAttributeValues: values,
    ReturnValues: 'ALL_NEW',
  }))
  return normalizeCounts(result.Attributes)
}

async function getUserReaction(imageId, userId) {
  const result = await dynamo.send(new GetCommand({
    TableName: TABLE,
    Key: { imageId, userId },
  }))
  return result.Item?.type || null
}

// One BatchGet per 100 images → { imageId: type } for the given user.
async function getUserReactions(imageIds, userId) {
  const map = {}
  for (let i = 0; i < imageIds.length; i += 100) {
    const chunk = imageIds.slice(i, i + 100)
    const result = await dynamo.send(new BatchGetCommand({
      RequestItems: {
        [TABLE]: {
          Keys: chunk.map(imageId => ({ imageId, userId })),
          ProjectionExpression: 'imageId, #t',
          ExpressionAttributeNames: { '#t': 'type' },
        },
      },
    }))
    for (const item of result.Responses?.[TABLE] || []) {
      map[item.imageId] = item.type
    }
  }
  return map
}

async function setReaction(imageId, userId, type) {
  const existing = await getUserReaction(imageId, userId)
  await dynamo.send(new PutCommand({
    TableName: TABLE,
    Item: { imageId, userId, type, createdAt: new Date().toISOString() },
  }))
  if (existing === type) return readCounts(imageId)
  const deltas = { like: 0, dislike: 0 }
  deltas[type] += 1
  if (existing) deltas[existing] -= 1
  return adjustCounts(imageId, deltas)
}

async function removeReaction(imageId, userId) {
  const existing = await getUserReaction(imageId, userId)
  await dynamo.send(new DeleteCommand({
    TableName: TABLE,
    Key: { imageId, userId },
  }))
  if (!existing) return readCounts(imageId)
  return adjustCounts(imageId, { [existing]: -1 })
}

async function getReactionCounts(imageId) {
  return readCounts(imageId)
}

async function deleteAllReactions(imageId) {
  const result = await dynamo.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'imageId = :iid',
    ExpressionAttributeValues: { ':iid': imageId },
    ProjectionExpression: 'imageId, userId',
  }))
  const items = result.Items || []
  if (items.length === 0) return
  for (let i = 0; i < items.length; i += 25) {
    const chunk = items.slice(i, i + 25)
    await dynamo.send(new BatchWriteCommand({
      RequestItems: {
        [TABLE]: chunk.map(item => ({
          DeleteRequest: { Key: { imageId: item.imageId, userId: item.userId } },
        })),
      },
    }))
  }
}

module.exports = {
  setReaction, removeReaction, getUserReaction, getUserReactions,
  getReactionCounts, deleteAllReactions,
}

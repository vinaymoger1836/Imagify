const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, PutCommand, DeleteCommand, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb')
const awsConfig = require('../config/aws')

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient(awsConfig))
const TABLE = process.env.FOLLOWS_TABLE_NAME

async function follow(followerId, followeeId) {
  await dynamo.send(new PutCommand({
    TableName: TABLE,
    Item: { followerId, followeeId, createdAt: new Date().toISOString() },
  }))
}

async function unfollow(followerId, followeeId) {
  await dynamo.send(new DeleteCommand({
    TableName: TABLE,
    Key: { followerId, followeeId },
  }))
}

async function isFollowing(followerId, followeeId) {
  const result = await dynamo.send(new GetCommand({
    TableName: TABLE,
    Key: { followerId, followeeId },
  }))
  return !!result.Item
}

async function getFollowerCount(followeeId) {
  const result = await dynamo.send(new QueryCommand({
    TableName: TABLE,
    IndexName: 'followeeId-index',
    KeyConditionExpression: 'followeeId = :fee',
    ExpressionAttributeValues: { ':fee': followeeId },
    Select: 'COUNT',
  }))
  return result.Count || 0
}

async function getFollowingIds(followerId) {
  const result = await dynamo.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'followerId = :fer',
    ExpressionAttributeValues: { ':fer': followerId },
  }))
  return (result.Items || []).map(item => item.followeeId)
}

module.exports = { follow, unfollow, isFollowing, getFollowerCount, getFollowingIds }

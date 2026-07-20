// One-time reconciliation: tally existing reactions into likeCount/dislikeCount
// on the labels items. Run once after deploying reaction-count denormalization.
//   node scripts/backfill-reaction-counts.js
require('dotenv').config()
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb')
const awsConfig = require('../src/config/aws')

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient(awsConfig))
const REACTIONS = process.env.REACTIONS_TABLE_NAME
const LABELS = process.env.DYNAMODB_TABLE_NAME

async function main() {
  const counts = {}
  let ExclusiveStartKey
  do {
    const res = await dynamo.send(new ScanCommand({ TableName: REACTIONS, ExclusiveStartKey }))
    for (const item of res.Items || []) {
      if (item.type !== 'like' && item.type !== 'dislike') continue
      counts[item.imageId] ||= { like: 0, dislike: 0 }
      counts[item.imageId][item.type]++
    }
    ExclusiveStartKey = res.LastEvaluatedKey
  } while (ExclusiveStartKey)

  const imageIds = Object.keys(counts)
  for (const imageId of imageIds) {
    await dynamo.send(new UpdateCommand({
      TableName: LABELS,
      Key: { imageId },
      UpdateExpression: 'SET likeCount = :l, dislikeCount = :d',
      ExpressionAttributeValues: { ':l': counts[imageId].like, ':d': counts[imageId].dislike },
    }))
    console.log(`${imageId}: ${counts[imageId].like} likes, ${counts[imageId].dislike} dislikes`)
  }
  console.log(`Backfilled ${imageIds.length} image(s).`)
}

main().catch(err => { console.error(err); process.exit(1) })

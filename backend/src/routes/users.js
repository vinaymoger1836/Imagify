const express = require('express')
const { queryByUser } = require('../services/dynamodb')
const { getFollowerCount, getFollowingIds, isFollowing } = require('../services/follows')
const { getReactionCounts, getUserReaction } = require('../services/reactions')
const { getImageUrl } = require('../services/s3')

const router = express.Router()

router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params
    const viewerId = req.user.userId

    const [items, followerCount, followingIds, viewerFollows] = await Promise.all([
      queryByUser(userId),
      getFollowerCount(userId),
      getFollowingIds(userId),
      isFollowing(viewerId, userId),
    ])

    const images = await Promise.all(
      items
        .filter(item => item.s3Key)
        .map(async item => {
          const [imageUrl, counts, userReaction] = await Promise.all([
            getImageUrl(item.s3Key),
            getReactionCounts(item.imageId),
            getUserReaction(item.imageId, viewerId),
          ])
          return {
            imageId: item.imageId,
            userId: item.userId || null,
            filename: item.filename,
            labels: item.labels || [],
            processedAt: item.processedAt,
            imageUrl,
            reactions: { ...counts, userReaction },
          }
        })
    )
    images.sort((a, b) => new Date(b.processedAt) - new Date(a.processedAt))

    res.json({
      userId,
      postCount: images.length,
      followerCount,
      followingCount: followingIds.length,
      isFollowing: viewerFollows,
      images,
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router

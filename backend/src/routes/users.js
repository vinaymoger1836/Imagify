const express = require('express')
const { queryByUser } = require('../services/dynamodb')
const { getFollowerCount, getFollowingIds, isFollowing, getFollowers } = require('../services/follows')
const { getUserReactions } = require('../services/reactions')
const { getImageUrl } = require('../services/s3')

const router = express.Router()

router.get('/:userId/followers', async (req, res, next) => {
  try {
    const followerIds = await getFollowers(req.params.userId)
    res.json({ followers: followerIds.map(id => ({ userId: id })) })
  } catch (err) {
    next(err)
  }
})

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

    const validItems = items.filter(item => item.s3Key)
    const userReactions = await getUserReactions(
      validItems.map(item => item.imageId),
      viewerId
    )

    const images = await Promise.all(
      validItems.map(async item => {
        const imageUrl = await getImageUrl(item.s3Key)
        return {
          imageId: item.imageId,
          userId: item.userId || null,
          filename: item.filename,
          labels: item.labels || [],
          processedAt: item.processedAt,
          downloadCount: item.downloadCount || 0,
          imageUrl,
          reactions: {
            likes: Math.max(0, item.likeCount || 0),
            dislikes: Math.max(0, item.dislikeCount || 0),
            userReaction: userReactions[item.imageId] || null,
          },
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

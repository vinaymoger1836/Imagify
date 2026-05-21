const express = require('express')
const { v4: uuidv4 } = require('uuid')
const { generateUploadUrl, getImageUrl } = require('../services/s3')
const { getLabels, scanImages, queryByUser } = require('../services/dynamodb')
const { getFollowingIds } = require('../services/follows')
const { getReactionCounts, getUserReaction } = require('../services/reactions')

const router = express.Router()

router.get('/', async (req, res, next) => {
  try {
    let items
    if (req.query.feed === 'following') {
      const followingIds = await getFollowingIds(req.user.userId)
      if (followingIds.length === 0) return res.json([])
      const results = await Promise.all(followingIds.map(uid => queryByUser(uid)))
      items = results.flat()
    } else if (req.query.feed === 'mine') {
      items = await queryByUser(req.user.userId)
    } else {
      items = await scanImages()
    }

    const images = await Promise.all(
      items
        .filter(item => item.s3Key)
        .map(async item => {
          const [imageUrl, counts, userReaction] = await Promise.all([
            getImageUrl(item.s3Key),
            getReactionCounts(item.imageId),
            getUserReaction(item.imageId, req.user.userId),
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
    res.json(images)
  } catch (err) {
    next(err)
  }
})

router.get('/upload-url', async (req, res, next) => {
  const { filename, contentType } = req.query
  if (!filename || !contentType) {
    return res.status(400).json({ error: 'filename and contentType are required' })
  }
  try {
    const imageId = uuidv4()
    const { uploadUrl } = await generateUploadUrl(req.user.userId, imageId, filename, contentType)
    res.json({ uploadUrl, imageId })
  } catch (err) {
    next(err)
  }
})

router.get('/:imageId/labels', async (req, res, next) => {
  try {
    const labels = await getLabels(req.params.imageId)
    res.json({ imageId: req.params.imageId, labels })
  } catch (err) {
    next(err)
  }
})

module.exports = router


const express = require('express')
const { v4: uuidv4 } = require('uuid')
const { generateUploadUrl, getImageUrl, deleteObject } = require('../services/s3')
const { getLabels, scanImages, queryByUser, getImage, deleteImage, incrementDownloads, findByHash } = require('../services/dynamodb')
const { getFollowingIds } = require('../services/follows')
const { getReactionCounts, getUserReaction, deleteAllReactions } = require('../services/reactions')

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
            downloadCount: item.downloadCount || 0,
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
  const { filename, contentType, fileHash } = req.query
  if (!filename || !contentType) {
    return res.status(400).json({ error: 'filename and contentType are required' })
  }
  try {
    if (fileHash) {
      const existing = await findByHash(fileHash)
      if (existing) return res.json({ duplicate: true, imageId: existing.imageId })
    }
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

router.post('/:imageId/download', async (req, res, next) => {
  try {
    await incrementDownloads(req.params.imageId)
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

router.delete('/:imageId', async (req, res, next) => {
  try {
    const item = await getImage(req.params.imageId)
    if (!item) return res.status(404).json({ error: 'Not found' })
    if (item.userId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' })
    await Promise.all([
      deleteObject(item.s3Key),
      deleteImage(req.params.imageId),
      deleteAllReactions(req.params.imageId),
    ])
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router


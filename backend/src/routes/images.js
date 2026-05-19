const express = require('express')
const { v4: uuidv4 } = require('uuid')
const { generateUploadUrl, getImageUrl } = require('../services/s3')
const { getLabels, scanImages } = require('../services/dynamodb')

const router = express.Router()

router.get('/', async (req, res, next) => {
  try {
    const items = await scanImages()
    const images = await Promise.all(
      items
        .filter(item => item.s3Key)
        .map(async item => ({
          imageId: item.imageId,
          filename: item.filename,
          labels: item.labels || [],
          processedAt: item.processedAt,
          imageUrl: await getImageUrl(item.s3Key),
        }))
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
    const { uploadUrl } = await generateUploadUrl(imageId, filename, contentType)
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

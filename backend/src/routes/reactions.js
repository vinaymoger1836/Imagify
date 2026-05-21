const express = require('express')
const { setReaction, removeReaction, getUserReaction, getReactionCounts } = require('../services/reactions')

const router = express.Router({ mergeParams: true })

router.get('/', async (req, res, next) => {
  try {
    const [counts, userReaction] = await Promise.all([
      getReactionCounts(req.params.imageId),
      getUserReaction(req.params.imageId, req.user.userId),
    ])
    res.json({ ...counts, userReaction })
  } catch (err) { next(err) }
})

router.put('/', async (req, res, next) => {
  const { type } = req.body
  if (!['like', 'dislike'].includes(type)) return res.status(400).json({ error: 'type must be like or dislike' })
  try {
    await setReaction(req.params.imageId, req.user.userId, type)
    const counts = await getReactionCounts(req.params.imageId)
    res.json({ ...counts, userReaction: type })
  } catch (err) { next(err) }
})

router.delete('/', async (req, res, next) => {
  try {
    await removeReaction(req.params.imageId, req.user.userId)
    const counts = await getReactionCounts(req.params.imageId)
    res.json({ ...counts, userReaction: null })
  } catch (err) { next(err) }
})

module.exports = router

const express = require('express')
const { follow, unfollow, isFollowing, getFollowerCount } = require('../services/follows')

const router = express.Router()

router.put('/:followeeId', async (req, res, next) => {
  try {
    const { followeeId } = req.params
    if (followeeId === req.user.userId) return res.status(400).json({ error: 'Cannot follow yourself' })
    await follow(req.user.userId, followeeId)
    res.json({ following: true })
  } catch (err) { next(err) }
})

router.delete('/:followeeId', async (req, res, next) => {
  try {
    await unfollow(req.user.userId, req.params.followeeId)
    res.json({ following: false })
  } catch (err) { next(err) }
})

router.get('/:followeeId', async (req, res, next) => {
  try {
    const [following, followerCount] = await Promise.all([
      isFollowing(req.user.userId, req.params.followeeId),
      getFollowerCount(req.params.followeeId),
    ])
    res.json({ following, followerCount })
  } catch (err) { next(err) }
})

module.exports = router

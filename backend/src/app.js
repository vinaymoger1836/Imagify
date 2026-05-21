const express = require('express')
const cors = require('cors')
const requireAuth = require('./middleware/auth')
const imageRoutes = require('./routes/images')
const reactionsRouter = require('./routes/reactions')
const followsRouter = require('./routes/follows')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api', requireAuth)
app.use('/api/images', imageRoutes)
app.use('/api/images/:imageId/reactions', reactionsRouter)
app.use('/api/follows', followsRouter)

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

module.exports = app

const express = require('express')
const cors = require('cors')
const imageRoutes = require('./routes/images')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/images', imageRoutes)

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

module.exports = app

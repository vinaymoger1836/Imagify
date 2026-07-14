// API Gateway validates the JWT signature before requests reach EC2.
// This middleware only decodes the token to extract userId — no re-verification needed.
module.exports = function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const payload = JSON.parse(Buffer.from(header.split('.')[1], 'base64url').toString('utf8'))
    if (!payload.sub) throw new Error('No sub claim')
    req.user = { userId: payload.sub }
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}


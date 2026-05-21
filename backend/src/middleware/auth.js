const { CognitoJwtVerifier } = require('aws-jwt-verify')

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: 'access',
  clientId: process.env.COGNITO_CLIENT_ID,
})

module.exports = async function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const payload = await verifier.verify(header.slice(7))
    req.user = { userId: payload.sub }
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

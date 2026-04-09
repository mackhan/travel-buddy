// middleware/auth.js - JWT 鉴权中间件
const jwt = require('jsonwebtoken')
const config = require('../config')

/**
 * JWT 鉴权中间件
 * 验证 Authorization: Bearer <token>
 * 成功后在 req.userId 中注入用户 ID
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: -1, message: '未登录，请先登录' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    req.userId = decoded.userId
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ code: -1, message: '登录已过期，请重新登录' })
    }
    return res.status(401).json({ code: -1, message: '无效的登录凭证' })
  }
}

module.exports = authMiddleware

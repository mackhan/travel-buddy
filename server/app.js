// app.js - 服务端入口
const express = require('express')
const http = require('http')
const cors = require('cors')
const mongoose = require('mongoose')
const config = require('./config')
const { initSocket } = require('./services/socketService')

const app = express()
const server = http.createServer(app)

// ====== 中间件 ======
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ====== 路由 ======
app.use('/api/auth', require('./routes/auth'))
app.use('/api/users', require('./routes/user'))
app.use('/api/trips', require('./routes/trip'))
app.use('/api/messages', require('./routes/message'))
app.use('/api/reviews', require('./routes/review'))
app.use('/api/expenses', require('./routes/expense'))

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// 404 兜底
app.use((req, res) => {
  res.status(404).json({ code: -1, message: `接口不存在: ${req.method} ${req.path}` })
})

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err.stack)
  res.status(err.status || 500).json({
    message: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// ====== WebSocket ======
initSocket(server)

// ====== 数据库连接 & 启动服务 ======
const startServer = () => {
  server.listen(config.port, () => {
    console.log(`🚀 服务已启动: http://localhost:${config.port}`)
  })
}

mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 })
  .then(() => {
    console.log('✅ MongoDB 已连接')
    startServer()
  })
  .catch(err => {
    console.warn('⚠️  MongoDB 连接失败，以降级模式启动（前端将使用 Mock 数据）:', err.message)
    startServer()
  })

module.exports = app

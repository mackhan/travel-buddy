// app.js - 服务端入口
const express = require('express')
const http = require('http')
const cors = require('cors')
const config = require('./config')
const sequelize = require('./db')
const { initSocket } = require('./services/socketService')

const app = express()
const server = http.createServer(app)

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/auth', require('./routes/auth'))
app.use('/api/users', require('./routes/user'))
app.use('/api/trips', require('./routes/trip'))
app.use('/api/messages', require('./routes/message'))
app.use('/api/reviews', require('./routes/review'))
app.use('/api/expenses', require('./routes/expense'))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

app.use((req, res) => {
  res.status(404).json({ code: -1, message: `接口不存在: ${req.method} ${req.path}` })
})

app.use((err, req, res, next) => {
  console.error('服务器错误:', err.stack)
  res.status(err.status || 500).json({ message: err.message || '服务器内部错误' })
})

initSocket(server)

// 设置 Model 关联
const User = require('./models/User')
const Trip = require('./models/Trip')
const Message = require('./models/Message')
const Review = require('./models/Review')
const Expense = require('./models/Expense')

Trip.belongsTo(User, { foreignKey: 'userId', as: 'user' })
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' })
Review.belongsTo(User, { foreignKey: 'fromUserId', as: 'fromUser' })
Review.belongsTo(User, { foreignKey: 'toUserId', as: 'toUser' })
Review.belongsTo(Trip, { foreignKey: 'tripId', as: 'trip' })
Expense.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' })

const startServer = () => {
  server.listen(config.port, () => {
    console.log(`🚀 服务已启动: http://localhost:${config.port}`)
  })
}

// 同步数据库表结构并启动
const { ensureDatabase } = require('./db')
ensureDatabase()
  .then(() => sequelize.authenticate())
  .then(() => {
    console.log('✅ MySQL 已连接')
    return sequelize.sync({ alter: true })
  })
  .then(() => {
    console.log('✅ 数据库表同步完成')
    startServer()
  })
  .catch(err => {
    console.warn('⚠️  数据库连接失败，服务仍启动（接口将返回错误）:', err.message)
    startServer()
  })

module.exports = app

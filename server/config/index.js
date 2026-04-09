// config/index.js - 配置管理
require('dotenv').config()

module.exports = {
  // 服务端口
  port: process.env.PORT || 3000,

  // MongoDB
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/travel-buddy',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'travel-buddy-secret-key-change-in-production',
  jwtExpiresIn: '7d',

  // 微信小程序
  wx: {
    appId: process.env.WX_APP_ID || 'your-app-id',
    appSecret: process.env.WX_APP_SECRET || 'your-app-secret'
  },

  // 分页默认值
  pagination: {
    defaultPage: 1,
    defaultLimit: 20,
    maxLimit: 100
  }
}

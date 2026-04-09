// models/User.js - 用户模型
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  openid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  nickname: {
    type: String,
    default: '旅行者'
  },
  avatar: {
    type: String,
    default: ''
  },
  gender: {
    type: Number,  // 0-未知 1-男 2-女
    default: 0
  },
  age: {
    type: String,
    default: ''    // 年龄段：'90后', '00后' 等
  },
  bio: {
    type: String,
    default: '',
    maxlength: 200
  },
  travelPrefs: {
    type: [String],  // 旅行偏好标签
    default: []
  },
  creditScore: {
    type: Number,
    default: 5.0,    // 默认 5 分满分
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  tripCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('User', userSchema)

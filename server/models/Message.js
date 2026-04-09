// models/Message.js - 消息模型
const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: ['text', 'image', 'system'],
    default: 'text'
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// 复合索引：对话消息列表查询（按时间倒序）
messageSchema.index({ conversationId: 1, createdAt: -1 })

// 未读消息查询索引
messageSchema.index({ receiverId: 1, read: 1 })

module.exports = mongoose.model('Message', messageSchema)

// models/Trip.js - 行程模型
const mongoose = require('mongoose')

const tripSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  destination: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  tags: {
    type: [String],      // ['拼车', '拼房', '拼行程', '拼饭', '拼门票']
    default: [],
    validate: {
      validator: (v) => v.length > 0,
      message: '至少选择一个标签'
    }
  },
  description: {
    type: String,
    default: '',
    maxlength: 500
  },
  maxMembers: {
    type: Number,
    default: 0   // 0 表示不限
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  }
}, {
  timestamps: true
})

// 文本索引（支持目的地关键词搜索）
tripSchema.index({ destination: 'text' })

// 复合索引（加速匹配查询）
tripSchema.index({ startDate: 1, endDate: 1, status: 1 })
tripSchema.index({ status: 1, createdAt: -1 })

module.exports = mongoose.model('Trip', tripSchema)

// models/Review.js - 评价模型
const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  content: {
    type: String,
    default: '',
    maxlength: 500
  }
}, {
  timestamps: true
})

// 防止重复评价（同一趟行程同一用户只能评一次）
reviewSchema.index({ fromUserId: 1, toUserId: 1, tripId: 1 }, { unique: true })

module.exports = mongoose.model('Review', reviewSchema)

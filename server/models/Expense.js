// models/Expense.js - 费用分摊模型
const mongoose = require('mongoose')

const participantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,     // 金额（分）
    required: true
  },
  paid: {
    type: Boolean,
    default: false
  }
}, { _id: false })

const expenseSchema = new mongoose.Schema({
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    default: null
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  totalAmount: {
    type: Number,     // 总金额（分）
    required: true,
    min: 1
  },
  splitMode: {
    type: String,
    enum: ['equal', 'custom'],  // equal=均摊, custom=自定义
    default: 'equal'
  },
  participants: {
    type: [participantSchema],
    validate: {
      validator: (v) => v.length >= 2,
      message: '至少需要两人参与分摊'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'settled'],
    default: 'pending'
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('Expense', expenseSchema)

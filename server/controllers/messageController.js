// controllers/messageController.js - 消息控制器
const mongoose = require('mongoose')
const Message = require('../models/Message')
const User = require('../models/User')
const { success, fail, parsePagination } = require('../utils/helpers')

/**
 * 获取对话列表
 * GET /api/messages/conversations
 */
exports.getConversations = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId)

    // 聚合获取每个对话的最新消息
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiverId', userId] }, { $eq: ['$read', false] }] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { 'lastMessage.createdAt': -1 } }
    ])

    // 填充对方用户信息
    const result = await Promise.all(
      conversations.map(async (conv) => {
        const msg = conv.lastMessage
        const otherUserId = msg.senderId.toString() === userId.toString()
          ? msg.receiverId
          : msg.senderId

        const otherUser = await User.findById(otherUserId)
          .select('nickname avatar creditScore')
          .lean()

        return {
          conversationId: conv._id,
          otherUser,
          lastMessage: {
            content: msg.content,
            type: msg.type,
            createdAt: msg.createdAt
          },
          unreadCount: conv.unreadCount
        }
      })
    )

    success(res, result)
  } catch (err) {
    console.error('获取对话列表失败:', err)
    fail(res, '获取对话列表失败', 500)
  }
}

/**
 * 获取历史消息
 * GET /api/messages/:conversationId
 */
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params
    const { page, limit, skip } = parsePagination(req.query)
    const userId = new mongoose.Types.ObjectId(req.userId)

    const [messages, total] = await Promise.all([
      Message.find({ conversationId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('senderId', 'nickname avatar')
        .lean(),
      Message.countDocuments({ conversationId })
    ])

    // 标记为已读
    await Message.updateMany(
      { conversationId, receiverId: userId, read: false },
      { $set: { read: true } }
    )

    success(res, {
      list: messages.reverse(),  // 按时间正序返回
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (err) {
    fail(res, '获取消息失败', 500)
  }
}

/**
 * 获取未读消息总数
 * GET /api/messages/unread/count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId)
    const count = await Message.countDocuments({
      receiverId: userId,
      read: false
    })
    success(res, { count })
  } catch (err) {
    fail(res, '获取未读数失败', 500)
  }
}

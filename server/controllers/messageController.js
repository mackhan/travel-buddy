// controllers/messageController.js
const { Op, fn, col, literal } = require('sequelize')
const sequelize = require('../db')
const Message = require('../models/Message')
const User = require('../models/User')
const { success, fail, parsePagination } = require('../utils/helpers')

exports.getConversations = async (req, res) => {
  try {
    const userId = req.userId
    // 每个会话取最新一条消息
    const latestIds = await sequelize.query(`
      SELECT MAX(id) as id FROM messages
      WHERE sender_id = :uid OR receiver_id = :uid
      GROUP BY conversation_id
    `, { replacements: { uid: userId }, type: sequelize.QueryTypes.SELECT })

    if (!latestIds.length) return success(res, [])

    const ids = latestIds.map(r => r.id)
    const messages = await Message.findAll({
      where: { id: { [Op.in]: ids } },
      order: [['createdAt', 'DESC']]
    })

    const result = await Promise.all(messages.map(async (msg) => {
      const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId
      const otherUser = await User.findByPk(otherUserId, { attributes: ['id', 'nickname', 'avatar', 'creditScore'] })
      const unreadCount = await Message.count({ where: { conversationId: msg.conversationId, receiverId: userId, read: false } })
      return { conversationId: msg.conversationId, otherUser, lastMessage: { content: msg.content, type: msg.type, createdAt: msg.createdAt }, unreadCount }
    }))

    success(res, result)
  } catch (err) { console.error('获取对话列表失败:', err); fail(res, '获取对话列表失败', 500) }
}

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params
    const { page, limit, skip } = parsePagination(req.query)

    const { count, rows } = await Message.findAndCountAll({
      where: { conversationId },
      order: [['createdAt', 'DESC']],
      offset: skip, limit,
      include: [{ model: User, as: 'sender', attributes: ['id', 'nickname', 'avatar'] }]
    })

    await Message.update({ read: true }, { where: { conversationId, receiverId: req.userId, read: false } })

    success(res, { list: rows.reverse(), pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } })
  } catch (err) { fail(res, '获取消息失败', 500) }
}

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Message.count({ where: { receiverId: req.userId, read: false } })
    success(res, { count })
  } catch (err) { fail(res, '获取未读数失败', 500) }
}

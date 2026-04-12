// services/socketService.js - WebSocket 聊天服务（MySQL 版本）
const { WebSocketServer } = require('ws')
const url = require('url')
const jwt = require('jsonwebtoken')
const config = require('../config')
const Message = require('../models/Message')
const User = require('../models/User')

// 在线用户映射 userId -> Set<ws>
const onlineUsers = new Map()

function initSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' })

  wss.on('connection', (ws, req) => {
    const query = url.parse(req.url, true).query
    const token = query.token
    if (!token) { ws.close(4001, '未提供登录凭证'); return }

    let userId
    try {
      const decoded = jwt.verify(token, config.jwtSecret)
      userId = decoded.userId
    } catch (err) {
      ws.close(4002, '登录凭证无效'); return
    }

    ws.userId = userId
    console.log(`用户上线: ${userId}`)

    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set())
    onlineUsers.get(userId).add(ws)

    sendToSocket(ws, 'connected', { userId })

    ws.on('message', async (rawData) => {
      try {
        const { type, payload } = JSON.parse(rawData.toString())
        switch (type) {
          case 'chat:send': await handleChatSend(ws, userId, payload); break
          case 'chat:read': await handleChatRead(userId, payload); break
          case 'chat:typing': handleChatTyping(userId, payload); break
          default: console.warn('未知消息类型:', type)
        }
      } catch (err) {
        console.error('消息处理失败:', err)
        sendToSocket(ws, 'error', { message: '消息处理失败' })
      }
    })

    ws.on('close', () => {
      console.log(`用户下线: ${userId}`)
      const sockets = onlineUsers.get(userId)
      if (sockets) {
        sockets.delete(ws)
        if (sockets.size === 0) onlineUsers.delete(userId)
      }
    })

    ws.on('error', (err) => console.error(`WebSocket 错误 [${userId}]:`, err.message))
  })

  return wss
}

// ====== 发送私信 ======
async function handleChatSend(ws, userId, payload) {
  const { receiverId, content, type = 'text' } = payload || {}
  if (!receiverId || !content) return

  const conversationId = [userId, receiverId].sort().join('_')

  // 保存消息（MySQL + Sequelize）
  const message = await Message.create({
    conversationId,
    senderId: userId,
    receiverId: parseInt(receiverId),
    content,
    type
  })

  // 关联查询发送者信息
  const populatedMsg = await Message.findByPk(message.id, {
    include: [{ model: User, as: 'sender', attributes: ['id', 'nickname', 'avatar'] }]
  })

  const msgData = populatedMsg ? populatedMsg.toJSON() : message.toJSON()

  // 发给接收者
  sendToUser(receiverId, 'chat:receive', msgData)
  // 确认发送成功（回给发送者）
  sendToSocket(ws, 'chat:sent', msgData)
}

// ====== 标记已读（MySQL 版本）======
async function handleChatRead(userId, payload) {
  const { conversationId } = payload || {}
  if (!conversationId) return

  await Message.update(
    { read: true },
    { where: { conversationId, receiverId: userId, read: false } }
  )

  // 通知对方消息已读
  const otherUserId = conversationId.split('_').find(id => String(id) !== String(userId))
  if (otherUserId) sendToUser(otherUserId, 'chat:readConfirm', { conversationId })
}

// ====== 正在输入 ======
function handleChatTyping(userId, payload) {
  const { receiverId } = payload || {}
  if (!receiverId) return
  sendToUser(receiverId, 'chat:typing', { userId })
}

function sendToSocket(ws, type, payload) {
  if (ws.readyState === 1) ws.send(JSON.stringify({ type, payload }))
}

function sendToUser(userId, type, payload) {
  const sockets = onlineUsers.get(parseInt(userId))
  if (sockets) {
    const data = JSON.stringify({ type, payload })
    sockets.forEach(ws => { if (ws.readyState === 1) ws.send(data) })
  }
}

function isUserOnline(userId) {
  return onlineUsers.has(userId) && onlineUsers.get(userId).size > 0
}

/**
 * 批量推送 WebSocket 通知给多个用户
 * @param {number[]} userIds - 接收者 ID 数组
 * @param {string} type - 消息类型
 * @param {object} payload - 消息内容
 */
function sendToUsers(userIds, type, payload) {
  const data = JSON.stringify({ type, payload })
  userIds.forEach(id => {
    const sockets = onlineUsers.get(parseInt(id))
    if (sockets) sockets.forEach(ws => { if (ws.readyState === 1) ws.send(data) })
  })
}

module.exports = { initSocket, isUserOnline, sendToUser, sendToUsers }

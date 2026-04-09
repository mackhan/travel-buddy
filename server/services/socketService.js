// services/socketService.js - 原生 WebSocket 聊天服务
// 使用 ws 库替代 Socket.io，与微信小程序 wx.connectSocket 完全兼容
const { WebSocketServer } = require('ws')
const url = require('url')
const jwt = require('jsonwebtoken')
const config = require('../config')
const Message = require('../models/Message')

// 在线用户映射 userId -> Set<ws>（支持多连接）
const onlineUsers = new Map()

function initSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' })

  wss.on('connection', (ws, req) => {
    // 从 URL query 参数获取 token 鉴权
    const query = url.parse(req.url, true).query
    const token = query.token
    if (!token) {
      ws.close(4001, '未提供登录凭证')
      return
    }

    let userId
    try {
      const decoded = jwt.verify(token, config.jwtSecret)
      userId = decoded.userId
    } catch (err) {
      ws.close(4002, '登录凭证无效')
      return
    }

    ws.userId = userId
    console.log(`用户上线: ${userId}`)

    // 记录在线状态
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set())
    }
    onlineUsers.get(userId).add(ws)

    // 发送连接成功确认
    sendToSocket(ws, 'connected', { userId })

    // ====== 消息处理 ======
    ws.on('message', async (rawData) => {
      try {
        const msg = JSON.parse(rawData.toString())
        const { type, payload } = msg

        switch (type) {
          case 'chat:send':
            await handleChatSend(ws, userId, payload)
            break
          case 'chat:read':
            await handleChatRead(userId, payload)
            break
          case 'chat:typing':
            handleChatTyping(userId, payload)
            break
          default:
            console.warn('未知消息类型:', type)
        }
      } catch (err) {
        console.error('消息处理失败:', err)
        sendToSocket(ws, 'error', { message: '消息处理失败' })
      }
    })

    // ====== 断开连接 ======
    ws.on('close', () => {
      console.log(`用户下线: ${userId}`)
      const sockets = onlineUsers.get(userId)
      if (sockets) {
        sockets.delete(ws)
        if (sockets.size === 0) {
          onlineUsers.delete(userId)
        }
      }
    })

    ws.on('error', (err) => {
      console.error(`WebSocket 错误 [${userId}]:`, err.message)
    })
  })

  return wss
}

// ====== 发送私信 ======
async function handleChatSend(ws, userId, payload) {
  const { receiverId, content, type = 'text' } = payload || {}
  if (!receiverId || !content) return

  // 生成会话 ID
  const conversationId = [userId, receiverId].sort().join('_')

  // 保存消息到数据库
  const message = await Message.create({
    conversationId,
    senderId: userId,
    receiverId,
    content,
    type
  })

  const populatedMsg = await Message.findById(message._id)
    .populate('senderId', 'nickname avatar')
    .lean()

  // 发给接收者
  sendToUser(receiverId, 'chat:receive', populatedMsg)

  // 确认发送成功（回给发送者）
  sendToSocket(ws, 'chat:sent', populatedMsg)
}

// ====== 标记已读 ======
async function handleChatRead(userId, payload) {
  const { conversationId } = payload || {}
  if (!conversationId) return

  await Message.updateMany(
    { conversationId, receiverId: userId, read: false },
    { $set: { read: true } }
  )

  // 通知对方消息已读
  const otherUserId = conversationId.split('_').find(id => id !== userId)
  if (otherUserId) {
    sendToUser(otherUserId, 'chat:readConfirm', { conversationId })
  }
}

// ====== 正在输入 ======
function handleChatTyping(userId, payload) {
  const { receiverId } = payload || {}
  if (!receiverId) return
  sendToUser(receiverId, 'chat:typing', { userId })
}

// ====== 工具函数 ======

/** 向单个 WebSocket 连接发送消息 */
function sendToSocket(ws, type, payload) {
  if (ws.readyState === 1) { // WebSocket.OPEN
    ws.send(JSON.stringify({ type, payload }))
  }
}

/** 向某用户的所有连接发送消息 */
function sendToUser(userId, type, payload) {
  const sockets = onlineUsers.get(userId)
  if (sockets) {
    const data = JSON.stringify({ type, payload })
    sockets.forEach(ws => {
      if (ws.readyState === 1) {
        ws.send(data)
      }
    })
  }
}

function isUserOnline(userId) {
  return onlineUsers.has(userId) && onlineUsers.get(userId).size > 0
}

module.exports = { initSocket, isUserOnline }

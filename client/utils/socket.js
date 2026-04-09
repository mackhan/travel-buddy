// utils/socket.js - WebSocket 连接管理
// 注意：不能在模块顶层调用 getApp()，必须在函数内部获取

class SocketManager {
  constructor() {
    this.socketTask = null
    this.isConnected = false
    this.reconnectTimer = null
    this.reconnectCount = 0
    this.maxReconnect = 5
    this.listeners = new Map()
  }

  /**
   * 建立 WebSocket 连接
   */
  connect() {
    if (this.isConnected || this.socketTask) return

    const app = getApp()

    // Mock 模式下不建立真实连接
    if (app.globalData.mockMode) {
      console.log('🎭 Mock 模式：跳过 WebSocket 连接')
      return
    }

    const token = app.globalData.token
    if (!token) {
      console.warn('未登录，无法建立 WebSocket 连接')
      return
    }

    this.socketTask = wx.connectSocket({
      url: `${app.globalData.socketUrl}/ws?token=${token}`,
      success: () => {
        console.log('WebSocket 连接中...')
      }
    })

    this.socketTask.onOpen(() => {
      console.log('WebSocket 已连接')
      this.isConnected = true
      this.reconnectCount = 0
    })

    this.socketTask.onMessage((res) => {
      try {
        const data = JSON.parse(res.data)
        const { type, payload } = data
        // 通知对应的监听器
        if (this.listeners.has(type)) {
          this.listeners.get(type).forEach(cb => cb(payload))
        }
      } catch (e) {
        console.error('WebSocket 消息解析失败', e)
      }
    })

    this.socketTask.onClose(() => {
      console.log('WebSocket 已断开')
      this.isConnected = false
      this.socketTask = null
      this.tryReconnect()
    })

    this.socketTask.onError((err) => {
      console.error('WebSocket 错误', err)
      this.isConnected = false
    })
  }

  /**
   * 发送消息
   */
  send(type, payload) {
    // Mock 模式下模拟发送成功
    const app = getApp()
    if (app.globalData.mockMode) {
      console.log('🎭 Mock 模式：模拟发送消息', type)
      // 模拟服务端返回确认
      setTimeout(() => {
        if (type === 'chat:message' && this.listeners.has('chat:sent')) {
          this.listeners.get('chat:sent').forEach(cb => cb({
            _id: 'msg_mock_' + Date.now(),
            ...payload,
            createdAt: new Date().toISOString()
          }))
        }
      }, 100)
      return true
    }

    if (!this.isConnected || !this.socketTask) {
      console.warn('WebSocket 未连接，消息发送失败')
      return false
    }

    this.socketTask.send({
      data: JSON.stringify({ type, payload })
    })
    return true
  }

  /**
   * 注册消息监听
   */
  on(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type).add(callback)
  }

  /**
   * 移除消息监听
   */
  off(type, callback) {
    if (this.listeners.has(type)) {
      this.listeners.get(type).delete(callback)
    }
  }

  /**
   * 断线重连
   */
  tryReconnect() {
    if (this.reconnectCount >= this.maxReconnect) {
      console.warn('WebSocket 重连次数已达上限')
      return
    }

    clearTimeout(this.reconnectTimer)
    this.reconnectTimer = setTimeout(() => {
      this.reconnectCount++
      console.log(`WebSocket 第 ${this.reconnectCount} 次重连...`)
      this.connect()
    }, Math.min(1000 * Math.pow(2, this.reconnectCount), 30000))
  }

  /**
   * 关闭连接
   */
  close() {
    clearTimeout(this.reconnectTimer)
    if (this.socketTask) {
      this.socketTask.close()
      this.socketTask = null
    }
    this.isConnected = false
  }
}

// 单例
const socketManager = new SocketManager()

module.exports = socketManager

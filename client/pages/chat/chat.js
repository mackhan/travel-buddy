// pages/chat/chat.js
const { get, post } = require('../../utils/request')
const socket = require('../../utils/socket')

/** 获取当前用户 ID（兼容 id 和 _id） */
function getMyId() {
  const app = getApp()
  const u = app.globalData.userInfo
  return u && (u.id || u._id) || ''
}

/** 补零 */
function pad(n) { return n < 10 ? '0' + n : '' + n }

/**
 * 将 ISO 时间字符串转为友好的聊天时间文本
 * - 今天：HH:mm
 * - 昨天：昨天 HH:mm
 * - 今年其他日期：MM-DD HH:mm
 * - 跨年：YYYY-MM-DD HH:mm
 */
function formatMsgTime(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return ''

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const time = pad(d.getHours()) + ':' + pad(d.getMinutes())

  if (msgDay.getTime() === today.getTime()) {
    return time
  } else if (msgDay.getTime() === yesterday.getTime()) {
    return '昨天 ' + time
  } else if (d.getFullYear() === now.getFullYear()) {
    return pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + time
  }
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + time
}

/** 判断两条消息间隔是否 >= 5 分钟 */
function shouldShowTime(prev, curr) {
  if (!prev || !prev.createdAt) return true
  if (!curr || !curr.createdAt) return false
  const diff = new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime()
  return diff >= 5 * 60 * 1000
}

/** 为消息列表标记 showTime 和 displayTime */
function markTimeFlags(messages) {
  return messages.map((msg, i) => ({
    ...msg,
    showTime: shouldShowTime(messages[i - 1], msg),
    displayTime: formatMsgTime(msg.createdAt)
  }))
}

Page({
  data: {
    conversationId: '',
    otherUserId: '',
    otherNickname: '',
    messages: [],
    inputValue: '',
    scrollToId: '',
    hasMore: false,
    page: 1,
    isTyping: false,
    myAvatar: '',
    otherAvatar: '',
    myId: ''
  },

  onLoad(options) {
    const { conversationId, userId, nickname } = options
    const app = getApp()
    const myInfo = app.globalData.userInfo || {}
    const myId = myInfo.id || myInfo._id || ''

    this.setData({
      conversationId,
      otherUserId: userId,
      otherNickname: nickname || '搭子',
      myAvatar: myInfo.avatar || '/assets/default-avatar.png',
      myId
    })

    wx.setNavigationBarTitle({ title: nickname || '聊天' })

    // 加载历史消息
    this.loadMessages()

    // 连接 WebSocket
    socket.connect()

    // 监听收到的新消息
    this.onReceiveMessage = (msg) => {
      if (msg.conversationId === this.data.conversationId) {
        const myId = getMyId()
        const sender = msg.sender || msg.senderId || {}
        const senderId = sender.id || sender._id || msg.senderId
        if (String(senderId) === String(myId)) return

        // 更新对方头像
        if (sender.avatar) this.setData({ otherAvatar: sender.avatar })

        // apply 消息需要解析 applyData，且 isOwnerView=true（收到方就是行程主）
        let parsed = { ...msg, sender, isMine: false }
        if (msg.type === 'apply') {
          try { parsed.applyData = JSON.parse(msg.content) } catch (e) { parsed.applyData = {} }
          parsed.isOwnerView = true
        }

        const messages = markTimeFlags([...this.data.messages, parsed])
        this.setData({ messages })
        this.scrollToBottom()
        socket.send('chat:read', { conversationId: this.data.conversationId })
      }
    }
    socket.on('chat:receive', this.onReceiveMessage)

    // 监听发送确认
    this.onSentConfirm = (msg) => {
      if (msg.conversationId === this.data.conversationId) {
        // apply 消息：解析 applyData，isOwnerView=false（发送方是申请人）
        let parsed = { ...msg, isMine: true }
        if (msg.type === 'apply') {
          try { parsed.applyData = JSON.parse(msg.content) } catch (e) { parsed.applyData = {} }
          parsed.isOwnerView = false
        }
        const messages = markTimeFlags(this.data.messages.map(m => {
          if (m._id && String(m._id).startsWith('temp_') && m.content === msg.content) {
            return parsed
          }
          return m
        }))
        this.setData({ messages })
      }
    }
    socket.on('chat:sent', this.onSentConfirm)

    // 监听对方输入
    this.onTyping = () => {
      this.setData({ isTyping: true })
      clearTimeout(this.typingTimer)
      this.typingTimer = setTimeout(() => {
        this.setData({ isTyping: false })
      }, 3000)
    }
    socket.on('chat:typing', this.onTyping)

    // 监听行程状态变更通知（completed/cancelled/member_left）
    this.onTripNotify = (data) => {
      const titleMap = {
        completed: '行程已完成，快去评价吧！',
        cancelled: '行程已被取消',
        member_left: data.message || '有成员退出了行程'
      }
      const title = titleMap[data.status || data.event] || data.message || '行程状态已更新'
      wx.showToast({ title, icon: 'none', duration: 3000 })
    }
    socket.on('trip:notify', this.onTripNotify)

    // 监听申请状态变更（行程主审批后实时刷新卡片）
    this.onApplyUpdate = (data) => {
      const messages = this.data.messages.map(m => {
        if (m.type === 'apply' && m.tripId === data.tripId) {
          return { ...m, applyStatus: data.applyStatus }
        }
        return m
      })
      this.setData({ messages })
    }
    socket.on('apply:update', this.onApplyUpdate)
  },

  onUnload() {
    socket.off('chat:receive', this.onReceiveMessage)
    socket.off('chat:sent', this.onSentConfirm)
    socket.off('chat:typing', this.onTyping)
    socket.off('trip:notify', this.onTripNotify)
    socket.off('apply:update', this.onApplyUpdate)
    clearTimeout(this.typingTimer)
  },

  async loadMessages() {
    try {
      const res = await get(`/messages/${this.data.conversationId}`, {
        page: this.data.page,
        limit: 30
      })
      const data = res.data || {}
      const myId = getMyId()

      const messages = (data.list || []).map(msg => {
        // 兼容 MySQL(msg.sender) 和 MongoDB(msg.senderId)
        const sender = msg.sender || msg.senderId || {}
        const senderId = sender.id || sender._id || msg.senderId
        const isMine = String(senderId) === String(myId)

        // apply 消息：解析 JSON content，标记是否是行程主视角（可审批）
        let applyData = null
        if (msg.type === 'apply') {
          try { applyData = JSON.parse(msg.content) } catch (e) { applyData = {} }
          // isOwnerView: 我是接收方（行程主），且状态还是 pending
          const receiverId = msg.receiverId || (msg.receiver && (msg.receiver.id || msg.receiver._id))
          const isOwnerView = String(receiverId) === String(myId)
          return { ...msg, sender, isMine, applyData, isOwnerView }
        }

        return {
          ...msg,
          sender,
          isMine: String(senderId) === String(myId)
        }
      })

      // 获取对方头像
      const otherMsg = messages.find(m => !m.isMine)
      if (otherMsg && otherMsg.sender && otherMsg.sender.avatar) {
        this.setData({ otherAvatar: otherMsg.sender.avatar })
      }

      const merged = this.data.page === 1 ? messages : [...messages, ...this.data.messages]
      this.setData({
        messages: markTimeFlags(merged),
        hasMore: data.pagination ? data.pagination.page < data.pagination.totalPages : false
      })

      if (this.data.page === 1) this.scrollToBottom()
    } catch (e) {
      console.error('加载消息失败', e)
    }
  },

  loadEarlier() {
    this.setData({ page: this.data.page + 1 })
    this.loadMessages()
  },

  onInput(e) {
    this.setData({ inputValue: e.detail.value })
    // 通知对方正在输入
    socket.send('chat:typing', { receiverId: this.data.otherUserId })
  },

  sendMessage() {
    const content = this.data.inputValue.trim()
    if (!content) return

    // 通过 WebSocket 发送
    socket.send('chat:send', {
      receiverId: this.data.otherUserId,
      content,
      type: 'text'
    })

    // 先在本地显示临时消息（chat:sent 回调会用真实消息替换）
    const myId = getMyId()
    const tempMsg = {
      _id: 'temp_' + Date.now(),
      conversationId: this.data.conversationId,
      senderId: myId,
      content,
      isMine: true,
      createdAt: new Date().toISOString()
    }

    this.setData({
      messages: markTimeFlags([...this.data.messages, tempMsg]),
      inputValue: ''
    })
    this.scrollToBottom()
  },

  scrollToBottom() {
    setTimeout(() => {
      this.setData({ scrollToId: 'chat-bottom' })
    }, 100)
  },

  /** 点击系统消息行程卡片，跳转到行程详情 */
  goTripDetail(e) {
    const tripId = e.currentTarget.dataset.tripId
    if (!tripId) return
    wx.navigateTo({ url: `/pages/detail/detail?id=${tripId}`, fail: () => wx.redirectTo({ url: `/pages/detail/detail?id=${tripId}` }) })
  },

  /** 点击对方头像，跳转查看对方资料 */
  viewOtherProfile() {
    const userId = this.data.otherUserId
    if (!userId) return
    wx.navigateTo({ url: `/pages/profile/profile?userId=${userId}`, fail: () => wx.redirectTo({ url: `/pages/profile/profile?userId=${userId}` }) })
  },

  /** 点击自己头像，跳转自己资料 */
  viewMyProfile() {
    wx.navigateTo({ url: '/pages/profile/profile', fail: () => wx.switchTab({ url: '/pages/profile/profile' }) })
  },

  /** 点击申请卡片的申请人，查看申请人资料 */
  viewApplicantProfile(e) {
    const userId = e.currentTarget.dataset.userId
    if (!userId) return
    wx.navigateTo({ url: `/pages/profile/profile?userId=${userId}`, fail: () => wx.redirectTo({ url: `/pages/profile/profile?userId=${userId}` }) })
  },

  /** 同意申请 */
  async approveApply(e) {
    const { tripId, userId } = e.currentTarget.dataset
    wx.showLoading({ title: '处理中...' })
    try {
      await post(`/trips/${tripId}/approve/${userId}`)
      // 本地立即更新卡片状态
      const messages = this.data.messages.map(m => {
        if (m.type === 'apply' && m.tripId === tripId) return { ...m, applyStatus: 'approved' }
        return m
      })
      this.setData({ messages })
      wx.showToast({ title: '已同意申请', icon: 'success' })
    } catch (e) {
      wx.showToast({ title: e.message || '操作失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  /** 拒绝申请 */
  async rejectApply(e) {
    const { tripId, userId } = e.currentTarget.dataset
    wx.showLoading({ title: '处理中...' })
    try {
      await post(`/trips/${tripId}/reject/${userId}`)
      const messages = this.data.messages.map(m => {
        if (m.type === 'apply' && m.tripId === tripId) return { ...m, applyStatus: 'rejected' }
        return m
      })
      this.setData({ messages })
      wx.showToast({ title: '已拒绝申请', icon: 'none' })
    } catch (e) {
      wx.showToast({ title: e.message || '操作失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  }
})

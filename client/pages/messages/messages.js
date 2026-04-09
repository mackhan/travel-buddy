// pages/messages/messages.js
const { get } = require('../../utils/request')
const { timeAgo } = require('../../utils/util')

Page({
  data: {
    conversations: [],
    loading: false
  },

  onShow() {
    this.loadConversations()
  },

  async loadConversations() {
    this.setData({ loading: true })
    try {
      const res = await get('/messages/conversations')
      const conversations = (res.data || []).map(conv => ({
        ...conv,
        lastMessage: conv.lastMessage || { content: '', createdAt: new Date() },
        timeText: conv.lastMessage ? timeAgo(conv.lastMessage.createdAt) : ''
      }))
      this.setData({ conversations, loading: false })
    } catch (e) {
      this.setData({ loading: false })
    }
  },

  openChat(e) {
    const conv = e.currentTarget.dataset.conv
    wx.navigateTo({
      url: `/pages/chat/chat?conversationId=${conv.conversationId}&userId=${conv.otherUser._id}&nickname=${conv.otherUser.nickname}`
    })
  }
})

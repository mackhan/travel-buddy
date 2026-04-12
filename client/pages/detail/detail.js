// pages/detail/detail.js
const { get, put, post } = require('../../utils/request')
const { formatDate, getStars, getConversationId } = require('../../utils/util')

Page({
  data: {
    trip: null,
    loading: true,
    isOwner: false,
    startDateText: '',
    endDateText: '',
    days: 0,
    fullStars: [],
    emptyStars: [],
    tagIcons: {
      '拼车': '🚗',
      '拼房': '🏨',
      '拼行程': '🗺️',
      '拼饭': '🍜',
      '拼门票': '🎫'
    }
  },

  onLoad(options) {
    if (options.id) {
      this.loadTrip(options.id)
    }
  },

  async loadTrip(id) {
    try {
      const res = await get(`/trips/${id}`)
      const trip = res.data
      if (!trip) {
        wx.showToast({ title: '行程不存在', icon: 'none' })
        return
      }

      // 兼容 MySQL(trip.user) 和 MongoDB(trip.userId) 两种结构
      const author = trip.user || trip.userId || {}
      const app = getApp()
      const myId = app.globalData.userInfo && (app.globalData.userInfo.id || app.globalData.userInfo._id)
      const isOwner = String(author.id || author._id) === String(myId)

      const startDateText = formatDate(trip.startDate, 'MM月DD日')
      const endDateText = formatDate(trip.endDate, 'MM月DD日')
      const days = Math.max(1, Math.ceil(
        (new Date(trip.endDate) - new Date(trip.startDate)) / (1000 * 60 * 60 * 24)
      ))

      const starInfo = getStars(author.creditScore || 5)
      const fullStars = new Array(starInfo.full).fill(true)
      const emptyStars = new Array(5 - starInfo.full).fill(true)

      // 统一把作者信息挂到 trip.user
      trip.user = author

      this.setData({ trip, loading: false, isOwner, startDateText, endDateText, days, fullStars, emptyStars })
    } catch (e) {
      console.error('加载行程失败:', e)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  async joinTrip() {
    try {
      const id = this.data.trip.id || this.data.trip._id
      const res = await post(`/trips/${id}/join`)
      wx.showToast({ title: '申请已发送！', icon: 'success', duration: 1500 })
      // 申请成功后跳到聊天页，直接和对方沟通
      setTimeout(() => {
        const app = getApp()
        const myId = app.globalData.userInfo && (app.globalData.userInfo.id || app.globalData.userInfo._id)
        const author = this.data.trip.user || {}
        const otherId = author.id || author._id
        const { getConversationId } = require('../../utils/util')
        const conversationId = getConversationId(myId, otherId)
        wx.navigateTo({
          url: `/pages/chat/chat?conversationId=${conversationId}&userId=${otherId}&nickname=${author.nickname}`
        })
      }, 1500)
    } catch (e) { wx.showToast({ title: e.message || '申请失败', icon: 'none' }) }
  },

  startChat() {
    const app = getApp()
    const myId = app.globalData.userInfo && (app.globalData.userInfo.id || app.globalData.userInfo._id)
    const author = this.data.trip.user || {}
    const otherId = author.id || author._id
    const conversationId = getConversationId(myId, otherId)
    wx.navigateTo({
      url: `/pages/chat/chat?conversationId=${conversationId}&userId=${otherId}&nickname=${author.nickname}`
    })
  },

  republishTrip() {
    const trip = this.data.trip
    // 把当前行程数据传给发布页，让用户修改日期后重新发布
    const params = encodeURIComponent(JSON.stringify({
      destination: trip.destination,
      title: trip.title || '',
      tags: trip.tags || [],
      description: trip.description || '',
      maxMembers: trip.maxMembers || 0
    }))
    wx.navigateTo({ url: `/pages/publish/publish?prefill=${params}` })
  },

  viewProfile() {
    const author = this.data.trip && this.data.trip.user
    if (!author) return
    const id = author.id || author._id
    wx.navigateTo({ url: `/pages/profile/profile?userId=${id}` })
  },

  async cancelTrip() {
    const res = await new Promise(resolve => {
      wx.showModal({ title: '确认取消', content: '确定要取消这个行程吗？', success: resolve })
    })
    if (!res.confirm) return
    try {
      const id = this.data.trip.id || this.data.trip._id
      await put(`/trips/${id}`, { status: 'cancelled' })
      wx.showToast({ title: '已取消', icon: 'success' })
      this.loadTrip(id)
    } catch (e) { wx.showToast({ title: '操作失败', icon: 'none' }) }
  },

  async completeTrip() {
    try {
      const id = this.data.trip.id || this.data.trip._id
      await put(`/trips/${id}`, { status: 'completed' })
      wx.showToast({ title: '行程已完成 🎉', icon: 'success', duration: 2000 })
      setTimeout(() => wx.navigateBack(), 2000)
    } catch (e) { wx.showToast({ title: '操作失败', icon: 'none' }) }
  }
})

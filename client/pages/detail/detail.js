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

      const app = getApp()
      const isOwner = trip.userId._id === (app.globalData.userInfo && app.globalData.userInfo.id)

      const startDateText = formatDate(trip.startDate, 'MM月DD日')
      const endDateText = formatDate(trip.endDate, 'MM月DD日')
      const days = Math.max(1, Math.ceil(
        (new Date(trip.endDate) - new Date(trip.startDate)) / (1000 * 60 * 60 * 24)
      ))

      const starInfo = getStars(trip.userId.creditScore)
      const fullStars = new Array(starInfo.full).fill(true)
      const emptyStars = new Array(5 - starInfo.full).fill(true)

      this.setData({
        trip,
        loading: false,
        isOwner,
        startDateText,
        endDateText,
        days,
        fullStars,
        emptyStars
      })
    } catch (e) {
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  // 申请同行
  async joinTrip() {
    try {
      await post(`/trips/${this.data.trip._id}/join`)
      wx.showToast({ title: '已申请同行', icon: 'success' })
      this.loadTrip(this.data.trip._id)
    } catch (e) {
      wx.showToast({ title: '申请失败', icon: 'none' })
    }
  },

  // 发起私信
  startChat() {
    const app = getApp()
    const myId = app.globalData.userInfo && app.globalData.userInfo.id
    const otherId = this.data.trip.userId._id
    const conversationId = getConversationId(myId, otherId)

    wx.navigateTo({
      url: `/pages/chat/chat?conversationId=${conversationId}&userId=${otherId}&nickname=${this.data.trip.userId.nickname}`
    })
  },

  // 查看用户主页
  viewProfile() {
    // 暂时跳转到个人中心
  },

  // 取消行程
  async cancelTrip() {
    const res = await new Promise(resolve => {
      wx.showModal({
        title: '确认取消',
        content: '确定要取消这个行程吗？',
        success: resolve
      })
    })
    if (!res.confirm) return

    try {
      await put(`/trips/${this.data.trip._id}`, { status: 'cancelled' })
      wx.showToast({ title: '已取消', icon: 'success' })
      this.loadTrip(this.data.trip._id)
    } catch (e) {
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  // 标记完成
  async completeTrip() {
    try {
      await put(`/trips/${this.data.trip._id}`, { status: 'completed' })
      wx.showToast({ title: '已完成', icon: 'success' })
      this.loadTrip(this.data.trip._id)
    } catch (e) {
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  }
})

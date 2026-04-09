// pages/profile/profile.js
const { get, put } = require('../../utils/request')
const { formatDate, timeAgo } = require('../../utils/util')
const { logout } = require('../../utils/auth')

Page({
  data: {
    userInfo: {},
    showTrips: false,
    showReviews: false,
    myTrips: [],
    myReviews: [],
    tripStatus: '',
    // 编辑资料弹窗
    showEditBio: false,
    editBioValue: ''
  },

  onShow() {
    this.loadProfile()
  },

  async loadProfile() {
    try {
      const app = getApp()
      // 优先从缓存取
      if (app.globalData.userInfo) {
        this.setData({ userInfo: app.globalData.userInfo })
      }
      // 后台拉取最新
      const res = await get('/users/me')
      if (res.data) {
        // 统一 id 字段：后端返回 _id，但全局各处用 id，需要两者都有
        const userInfo = { ...res.data, id: res.data._id || res.data.id }
        this.setData({ userInfo })
        app.globalData.userInfo = userInfo
      }
    } catch (e) {
      console.error('加载资料失败', e)
    }
  },

  // 我的行程
  async goMyTrips() {
    this.setData({ showTrips: true, showReviews: false })
    this.loadMyTrips()
  },

  async loadMyTrips() {
    try {
      const params = { limit: 50 }
      if (this.data.tripStatus) params.status = this.data.tripStatus

      const res = await get('/trips/mine', params)
      const trips = (res.data.list || []).map(t => ({
        ...t,
        startDateText: formatDate(t.startDate, 'MM-DD'),
        endDateText: formatDate(t.endDate, 'MM-DD')
      }))
      this.setData({ myTrips: trips })
    } catch (e) {
      console.error('加载行程失败', e)
    }
  },

  filterTrips(e) {
    const status = e.currentTarget.dataset.status
    this.setData({ tripStatus: status })
    this.loadMyTrips()
  },

  hideTrips() {
    this.setData({ showTrips: false })
  },

  viewTrip(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  // 我的评价
  async goMyReviews() {
    this.setData({ showReviews: true, showTrips: false })
    this.loadMyReviews()
  },

  async loadMyReviews() {
    try {
      const userId = this.data.userInfo._id || this.data.userInfo.id
      const res = await get(`/reviews/user/${userId}`)
      const reviews = (res.data.list || []).map(r => ({
        ...r,
        starArr: new Array(Math.round(r.score)).fill(true),
        timeText: timeAgo(r.createdAt)
      }))
      this.setData({ myReviews: reviews })
    } catch (e) {
      console.error('加载评价失败', e)
    }
  },

  hideReviews() {
    this.setData({ showReviews: false })
  },

  // 费用分摊
  goExpense() {
    wx.navigateTo({ url: '/pages/expense/expense' })
  },

  // 编辑资料 — 使用自定义弹窗
  goEditProfile() {
    this.setData({
      showEditBio: true,
      editBioValue: this.data.userInfo.bio || ''
    })
  },

  onBioInput(e) {
    this.setData({ editBioValue: e.detail.value })
  },

  cancelEditBio() {
    this.setData({ showEditBio: false, editBioValue: '' })
  },

  async confirmEditBio() {
    const bio = this.data.editBioValue.trim()
    if (!bio) {
      wx.showToast({ title: '请输入内容', icon: 'none' })
      return
    }
    try {
      await put('/users/me', { bio })
      this.setData({ 'userInfo.bio': bio, showEditBio: false })
      wx.showToast({ title: '已更新', icon: 'success' })
    } catch (e) {
      wx.showToast({ title: '更新失败', icon: 'none' })
    }
  },

  // 退出登录
  doLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout()
          wx.reLaunch({ url: '/pages/index/index' })
        }
      }
    })
  },

  // 关于
  showAbout() {
    wx.showModal({
      title: '旅行搭子',
      content: '版本 1.0.0\n找到志同道合的旅伴，让旅行不再孤单 ✈️',
      showCancel: false
    })
  }
})

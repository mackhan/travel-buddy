// pages/profile/profile.js
const { get, put } = require('../../utils/request')
const { formatDate, timeAgo, getConversationId } = require('../../utils/util')
const { logout } = require('../../utils/auth')

Page({
  data: {
    userInfo: {},
    isLoggedIn: false,
    isOtherUser: false,
    viewingUserId: null,
    showTrips: false,
    showReviews: false,
    myTrips: [],
    myReviews: [],
    tripStatus: '',
    showEditBio: false,
    editBioValue: '',
    editNickname: ''
  },

  onLoad(options) {
    // 如果带了 userId 参数，查看他人资料
    if (options.userId) {
      this.setData({ viewingUserId: options.userId, isOtherUser: true })
    }
  },

  onShow() {
    const app = getApp()
    if (this.data.isOtherUser) {
      // 查看他人资料
      this.loadOtherProfile(this.data.viewingUserId)
      return
    }
    const token = wx.getStorageSync('token')
    const isMock = app.globalData.mockMode
    if (token && !isMock) {
      this.setData({ isLoggedIn: true })
      this.loadProfile()
    } else if (isMock) {
      this.setData({ isLoggedIn: true, userInfo: app.globalData.userInfo || {} })
    } else {
      this.setData({ isLoggedIn: false, userInfo: {} })
    }
  },

  async loadOtherProfile(userId) {
    try {
      const res = await get(`/users/${userId}`)
      if (res.data) {
        this.setData({ userInfo: res.data, isLoggedIn: true })
      }
    } catch (e) {
      wx.showToast({ title: '加载用户信息失败', icon: 'none' })
    }
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
        const userInfo = { ...res.data, id: res.data.id || res.data._id, _id: res.data.id || res.data._id }
        this.setData({ userInfo })
        app.globalData.userInfo = userInfo
      }
    } catch (e) {
      console.error('加载资料失败', e)
    }
  },

  // 未登录时手动登录
  async doLogin() {
    wx.showLoading({ title: '登录中...' })
    try {
      const app = getApp()
      await app.doLogin()
      wx.hideLoading()
      this.setData({ isLoggedIn: true })
      this.loadProfile()
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: '登录失败', icon: 'none' })
    }
  },

  startChat() {
    const app = getApp()
    const myId = app.globalData.userInfo && (app.globalData.userInfo.id || app.globalData.userInfo._id)
    const otherId = this.data.userInfo.id || this.data.userInfo._id
    if (!otherId) return
    const conversationId = getConversationId(myId, otherId)
    wx.navigateTo({
      url: `/pages/chat/chat?conversationId=${conversationId}&userId=${otherId}&nickname=${this.data.userInfo.nickname}`
    })
  },

  showCreditInfo() {
    wx.showModal({
      title: '信誉分说明',
      content: `你的信誉分：${this.data.userInfo.creditScore || 5.0}\n\n信誉分由其他搭子在旅行结束后评价产生，满分5分，影响其他用户对你的第一印象。`,
      showCancel: false
    })
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

  stopPropagation() {},

  // 选择头像
  chooseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempPath = res.tempFilePaths[0]
        wx.showLoading({ title: '上传中...' })
        try {
          // 上传到云存储
          const ext = tempPath.split('.').pop() || 'jpg'
          const cloudPath = `avatars/${Date.now()}.${ext}`
          const uploadRes = await wx.cloud.uploadFile({ cloudPath, filePath: tempPath })
          // 获取下载地址
          const fileRes = await wx.cloud.getTempFileURL({ fileList: [uploadRes.fileID] })
          const avatarUrl = fileRes.fileList[0].tempFileURL
          await put('/users/me', { avatar: avatarUrl })
          this.setData({ 'userInfo.avatar': avatarUrl })
          getApp().globalData.userInfo.avatar = avatarUrl
          wx.showToast({ title: '头像已更新', icon: 'success' })
        } catch (e) {
          console.error('上传头像失败:', e)
          wx.showToast({ title: '上传失败', icon: 'none' })
        } finally {
          wx.hideLoading()
        }
      }
    })
  },

  // 编辑资料
  goEditProfile() {
    this.setData({
      showEditBio: true,
      editBioValue: this.data.userInfo.bio || '',
      editNickname: this.data.userInfo.nickname || ''
    })
  },

  onBioInput(e) {
    this.setData({ editBioValue: e.detail.value })
  },

  onNicknameInput(e) {
    this.setData({ editNickname: e.detail.value })
  },

  cancelEditBio() {
    this.setData({ showEditBio: false, editBioValue: '', editNickname: '' })
  },

  async confirmEditBio() {
    const bio = this.data.editBioValue.trim()
    const nickname = this.data.editNickname.trim()
    if (!nickname) {
      wx.showToast({ title: '昵称不能为空', icon: 'none' })
      return
    }
    try {
      await put('/users/me', { bio, nickname })
      this.setData({
        'userInfo.bio': bio,
        'userInfo.nickname': nickname,
        showEditBio: false
      })
      const app = getApp()
      app.globalData.userInfo = { ...app.globalData.userInfo, bio, nickname }
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
          // 重置 App 全局状态
          const app = getApp()
          app.globalData.userInfo = null
          app.globalData.token = null
          app.globalData.mockMode = false
          // 重新启动小程序，走完整初始化流程
          wx.reLaunch({ url: '/pages/index/index' })
        }
      }
    })
  },

  // 关于
  showAbout() {
    wx.showModal({
      title: '旅行搭子',
      content: '版本 1.0.28\n找到志同道合的旅伴，让旅行不再孤单 ✈️',
      showCancel: false
    })
  }
})

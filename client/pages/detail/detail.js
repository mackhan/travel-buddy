// pages/detail/detail.js
const { get, put, post, del } = require('../../utils/request')
const { formatDate, getStars, getConversationId } = require('../../utils/util')

Page({
  data: {
    trip: null,
    loading: true,
    isOwner: false,
    myId: null,
    startDateText: '',
    endDateText: '',
    days: 0,
    fullStars: [],
    emptyStars: [],
    applicants: [],       // 待审批申请列表（仅行程主可见）
    members: [],          // 已批准的成员列表
    loadingApplicants: false,
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

  onShow() {
    // 从评价页返回时刷新行程
    if (this.data.trip) {
      const id = this.data.trip.id || this.data.trip._id
      if (id) this.loadTrip(id)
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

      trip.user = author

      this.setData({ trip, loading: false, isOwner, myId, startDateText, endDateText, days, fullStars, emptyStars })

      // 加载成员列表（所有人可见）
      this.loadMembers(id)

      // 行程主额外加载申请列表
      if (isOwner) {
        this.loadApplicants(id)
      }
    } catch (e) {
      console.error('加载行程失败:', e)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  async loadApplicants(id) {
    this.setData({ loadingApplicants: true })
    try {
      const res = await get(`/trips/${id}/applicants`)
      this.setData({ applicants: res.data || [], loadingApplicants: false })
    } catch (e) {
      this.setData({ loadingApplicants: false })
    }
  },

  async loadMembers(id) {
    try {
      const res = await get(`/trips/${id}/members`)
      // 竞态保护：确认当前行程 id 与请求 id 一致
      const currentTrip = this.data.trip
      const currentId = currentTrip && (currentTrip.id || currentTrip._id)
      if (String(currentId) !== String(id)) return
      const owner = currentTrip.user
      // ownerItem 确保 id 字段明确（防止 owner.id 为 undefined）
      const ownerItem = owner
        ? { user: { ...owner, id: owner.id || owner._id }, isOwner: true, status: 'owner', id: 'owner' }
        : null
      const participants = res.data || []
      // 防御性去重：过滤掉 participants 中已含行程主的情况
      const ownerId = owner && (owner.id || owner._id)
      const filtered = ownerId
        ? participants.filter(p => String(p.user && (p.user.id || p.user._id)) !== String(ownerId))
        : participants
      const members = ownerItem ? [ownerItem, ...filtered] : filtered
      this.setData({ members })
    } catch (e) {
      console.error('加载成员失败:', e)
    }
  },

  async approveApplicant(e) {
    const userId = e.currentTarget.dataset.userId
    const nickname = e.currentTarget.dataset.nickname
    try {
      wx.showLoading({ title: '处理中...' })
      const id = this.data.trip.id || this.data.trip._id
      await post(`/trips/${id}/approve/${userId}`)
      wx.hideLoading()
      wx.showToast({ title: `已同意 ${nickname} 的申请`, icon: 'success', duration: 2000 })
      this.loadApplicants(id)
      this.loadMembers(id)
      // 刷新行程数据（currentMembers 更新）
      setTimeout(() => this.loadTrip(id), 500)
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: e.message || '操作失败', icon: 'none' })
    }
  },

  async rejectApplicant(e) {
    const userId = e.currentTarget.dataset.userId
    const nickname = e.currentTarget.dataset.nickname
    const res = await new Promise(resolve => {
      wx.showModal({ title: '确认拒绝', content: `确定拒绝 ${nickname} 的申请吗？`, success: resolve })
    })
    if (!res.confirm) return
    try {
      wx.showLoading({ title: '处理中...' })
      const id = this.data.trip.id || this.data.trip._id
      await post(`/trips/${id}/reject/${userId}`)
      wx.hideLoading()
      wx.showToast({ title: '已拒绝', icon: 'success' })
      this.loadApplicants(id)
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: e.message || '操作失败', icon: 'none' })
    }
  },

  async joinTrip() {
    const trip = this.data.trip
    const myMemberStatus = trip.myMemberStatus

    // 已申请中，跳到聊天页
    if (myMemberStatus === 'pending') {
      wx.showToast({ title: '申请中，等待对方确认', icon: 'none' })
      return
    }
    // 已加入
    if (myMemberStatus === 'approved') {
      wx.showToast({ title: '您已加入该行程', icon: 'none' })
      return
    }

    try {
      const id = trip.id || trip._id
      const res = await post(`/trips/${id}/join`)
      wx.showToast({ title: '申请已发送！', icon: 'success', duration: 1500 })
      // 更新本地状态
      this.setData({ 'trip.myMemberStatus': 'pending' })
      setTimeout(() => {
        const app = getApp()
        const myId = app.globalData.userInfo && (app.globalData.userInfo.id || app.globalData.userInfo._id)
        const author = this.data.trip.user || {}
        const otherId = author.id || author._id
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

  /** 跳到评价页，评价搭子 */
  goReview(e) {
    const { userId, nickname } = e.currentTarget.dataset
    const tripId = this.data.trip.id || this.data.trip._id
    wx.navigateTo({
      url: `/pages/review/review?toUserId=${userId}&tripId=${tripId}&toNickname=${nickname}`
    })
  },

  /** 行程完成后评价行程主 */
  goReviewOwner() {
    const trip = this.data.trip
    const owner = trip.user || {}
    const tripId = trip.id || trip._id
    wx.navigateTo({
      url: `/pages/review/review?toUserId=${owner.id || owner._id}&tripId=${tripId}&toNickname=${owner.nickname}`
    })
  },

  republishTrip() {
    const trip = this.data.trip
    const params = encodeURIComponent(JSON.stringify({
      destination: trip.destination,
      title: trip.title || '',
      tags: trip.tags || [],
      description: trip.description || '',
      maxMembers: trip.maxMembers || 0
    }))
    wx.navigateTo({ url: `/pages/publish/publish?prefill=${params}` })
  },

  viewProfile(e) {
    // 优先取 data-user-id（已在 wxml 里绑定），兜底取 trip.user
    const id = (e && e.currentTarget && e.currentTarget.dataset.userId)
      || (this.data.trip && this.data.trip.user && (this.data.trip.user.id || this.data.trip.user._id))
    if (!id || id === 'undefined') { console.warn('[viewProfile] userId 为空'); return }
    wx.navigateTo({ url: `/pages/profile/profile?userId=${id}` })
  },

  viewMemberProfile(e) {
    const userId = e.currentTarget.dataset.userId
    if (!userId || userId === 'undefined') return
    wx.navigateTo({ url: `/pages/profile/profile?userId=${userId}` })
  },

  async leaveTrip() {
    const res = await new Promise(resolve => {
      wx.showModal({ title: '退出行程', content: '确定要退出这个行程吗？退出后行程主将收到通知。', success: resolve })
    })
    if (!res.confirm) return
    try {
      wx.showLoading({ title: '退出中...' })
      const id = this.data.trip.id || this.data.trip._id
      await del(`/trips/${id}/leave`)
      wx.hideLoading()
      wx.showToast({ title: '已退出行程', icon: 'success', duration: 2000 })
      setTimeout(() => this.loadTrip(id), 2000)
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: e.message || '退出失败', icon: 'none' })
    }
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
    const res = await new Promise(resolve => {
      wx.showModal({ title: '确认完成', content: '标记行程完成后，您和搭子们可以互相评价，确认完成吗？', success: resolve })
    })
    if (!res.confirm) return
    try {
      const id = this.data.trip.id || this.data.trip._id
      await put(`/trips/${id}`, { status: 'completed' })
      wx.showToast({ title: '行程已完成 🎉', icon: 'success', duration: 2000 })
      setTimeout(() => this.loadTrip(id), 2000)
    } catch (e) { wx.showToast({ title: '操作失败', icon: 'none' }) }
  },

  stopPropagation() {}
})

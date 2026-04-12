// pages/review/review.js
const { post } = require('../../utils/request')

Page({
  data: {
    toUserId: null,
    toNickname: '搭子',
    tripId: null,
    score: 0,         // 当前选中星级 1-5
    hoverScore: 0,    // 悬浮预览星级
    content: '',
    submitting: false,
    stars: [1, 2, 3, 4, 5]
  },

  onLoad(options) {
    const { toUserId, tripId, toNickname } = options
    this.setData({ toUserId: parseInt(toUserId), tripId: parseInt(tripId), toNickname: toNickname || '搭子' })
    wx.setNavigationBarTitle({ title: `评价 ${toNickname || '搭子'}` })
  },

  /** 点击选星 */
  selectStar(e) {
    const score = e.currentTarget.dataset.score
    this.setData({ score })
  },

  onInput(e) {
    this.setData({ content: e.detail.value })
  },

  async submit() {
    if (this.data.score === 0) {
      wx.showToast({ title: '请先选择星级', icon: 'none' })
      return
    }
    if (this.data.submitting) return

    this.setData({ submitting: true })
    try {
      await post('/reviews', {
        toUserId: this.data.toUserId,
        tripId: this.data.tripId,
        score: this.data.score,
        content: this.data.content.trim()
      })
      wx.showToast({ title: '评价成功 ✨', icon: 'success', duration: 1800 })
      setTimeout(() => wx.navigateBack(), 1800)
    } catch (e) {
      this.setData({ submitting: false })
      wx.showToast({ title: e.message || '提交失败', icon: 'none' })
    }
  }
})

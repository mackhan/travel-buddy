// pages/publish/publish.js
const { post } = require('../../utils/request')
const { formatDate } = require('../../utils/util')

Page({
  data: {
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
    tags: [],
    description: '',
    maxMembers: '',
    today: '',
    canSubmit: false,
    submitting: false,
    showCityPicker: false
  },

  onLoad() {
    this.setData({ today: formatDate(new Date(), 'YYYY-MM-DD') })
  },

  // 打开城市选择器
  openCityPicker() {
    this.setData({ showCityPicker: true })
  },

  // 关闭城市选择器
  closeCityPicker() {
    this.setData({ showCityPicker: false })
  },

  // 城市选择回调
  onCitySelect(e) {
    this.setData({ destination: e.detail.value })
    this.checkForm()
  },

  // 通用输入
  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [field]: e.detail.value })
    this.checkForm()
  },

  // 日期选择
  onStartDate(e) {
    this.setData({ startDate: e.detail.value })
    // 如果结束日期早于开始日期，自动清空
    if (this.data.endDate && this.data.endDate < e.detail.value) {
      this.setData({ endDate: '' })
    }
    this.checkForm()
  },

  onEndDate(e) {
    this.setData({ endDate: e.detail.value })
    this.checkForm()
  },

  // 标签变化
  onTagChange(e) {
    this.setData({ tags: e.detail.value })
    this.checkForm()
  },

  // 表单校验
  checkForm() {
    const { title, destination, startDate, endDate, tags } = this.data
    const canSubmit = title.trim() && destination.trim() && startDate && endDate && tags.length > 0
    this.setData({ canSubmit })
  },

  // 发布
  async onSubmit() {
    if (!this.data.canSubmit || this.data.submitting) return
    this.setData({ submitting: true })

    try {
      const { title, destination, startDate, endDate, tags, description, maxMembers } = this.data
      const postData = {
        title: title.trim(),
        destination: destination.trim(),
        startDate,
        endDate,
        tags,
        description
      }
      if (maxMembers && parseInt(maxMembers) > 0) {
        postData.maxMembers = parseInt(maxMembers)
      }
      await post('/trips', postData)

      wx.showToast({ title: '发布成功！', icon: 'success' })

      // 重置表单
      this.setData({
        title: '',
        destination: '',
        startDate: '',
        endDate: '',
        tags: [],
        description: '',
        maxMembers: '',
        canSubmit: false
      })

      // 延迟跳回首页
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' })
      }, 1500)
    } catch (e) {
      wx.showToast({ title: '发布失败', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  }
})

// pages/expense/expense.js
const { get, post } = require('../../utils/request')
const { formatMoney, timeAgo, yuanToCents } = require('../../utils/util')

Page({
  data: {
    expenses: [],
    loading: false,
    showForm: false,
    form: {
      title: '',
      totalAmount: '',
      memberCount: '2',
      splitMode: 'equal'
    },
    perPersonAmount: '0.00'
  },

  onLoad() {
    this.loadExpenses()
  },

  onShow() {
    this.loadExpenses()
  },

  async loadExpenses() {
    this.setData({ loading: true })
    try {
      const res = await get('/expenses')
      const expenses = (res.data.list || []).map(e => {
        const paidCount = e.participants.filter(p => p.paid).length
        return {
          ...e,
          totalAmountText: formatMoney(e.totalAmount),
          paidPercent: Math.round((paidCount / e.participants.length) * 100),
          timeText: timeAgo(e.createdAt)
        }
      })
      this.setData({ expenses, loading: false })
    } catch (e) {
      this.setData({ loading: false })
    }
  },

  stopPropagation() {},

  showCreateForm() {
    this.setData({ showForm: true })
  },

  hideCreateForm() {
    this.setData({
      showForm: false,
      form: { title: '', totalAmount: '', memberCount: '2', splitMode: 'equal' },
      perPersonAmount: '0.00'
    })
  },

  onFormInput(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({ [`form.${field}`]: value })
    this.calcPerPerson()
  },

  onSplitMode(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({ 'form.splitMode': mode })
  },

  calcPerPerson() {
    const { totalAmount, memberCount } = this.data.form
    const total = parseFloat(totalAmount) || 0
    const count = parseInt(memberCount) || 0
    if (total > 0 && count >= 2) {
      this.setData({ perPersonAmount: (total / count).toFixed(2) })
    } else {
      this.setData({ perPersonAmount: '0.00' })
    }
  },

  async createExpense() {
    const { title, totalAmount, memberCount, splitMode } = this.data.form
    if (!title.trim()) {
      return wx.showToast({ title: '请输入费用名称', icon: 'none' })
    }
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      return wx.showToast({ title: '请输入有效金额', icon: 'none' })
    }
    if (!memberCount || parseInt(memberCount) < 2) {
      return wx.showToast({ title: '至少需要2人参与', icon: 'none' })
    }

    try {
      const app = getApp()
      const myId = app.globalData.userInfo && (app.globalData.userInfo.id || app.globalData.userInfo._id)
      const count = parseInt(memberCount)
      const totalCents = yuanToCents(totalAmount)

      // MVP 阶段：创建者为第一个参与者（标记已付），其余为待确认占位
      // 后端会根据均摊模式自动计算各人金额
      const participants = []
      participants.push({
        userId: myId,
        amount: 0,
        paid: true  // 创建者默认已付
      })
      // 其余参与者暂时也设为创建者（MVP简化，待后续添加用户选择功能）
      // 注意：这里发送参与人数信息，让后端根据 splitMode 计算
      for (let i = 1; i < count; i++) {
        participants.push({
          userId: myId,  // MVP阶段占位，后续替换为真实用户选择器
          amount: 0,
          paid: false
        })
      }

      await post('/expenses', {
        title: title.trim(),
        totalAmount: totalCents,
        splitMode,
        participants
      })

      wx.showToast({ title: '创建成功', icon: 'success' })
      this.hideCreateForm()
      this.loadExpenses()
    } catch (e) {
      wx.showToast({ title: '创建失败', icon: 'none' })
    }
  },

  viewDetail(e) {
    const id = e.currentTarget.dataset.id
    // 可扩展为详情页
    wx.showToast({ title: '查看详情', icon: 'none' })
  }
})

Page({
  // 页面的数据对象
  data: {
    userInfo: {}, // 用户信息
    userId: '', // 用户ID
    stats: { // 用户统计数据
      published: 0, // 发布的搭子数量
      joined: 0, // 参与的搭子数量
      followers: 0 // 粉丝数量
    },
    unreadCount: 3 // 未读消息数量
  },

  // 页面加载时自动执行的生命周期函数
  onLoad() {
    // 加载用户信息
    this.loadUserInfo()
    // 加载统计数据
    this.loadStats()
  },

  // 页面显示时自动执行的生命周期函数
  onShow() {
    // 重新加载用户信息（确保数据最新）
    this.loadUserInfo()
  },

  // 加载用户信息的方法
  loadUserInfo() {
    // 从本地存储中获取用户信息，如果没有则使用空对象
    const userInfo = wx.getStorageSync('userInfo') || {}
    // 从本地存储中获取用户ID，如果没有则生成新的ID
    const userId = wx.getStorageSync('userId') || this.generateUserId()
    
    // 如果本地没有用户ID，则保存新生成的ID
    if (!wx.getStorageSync('userId')) {
      wx.setStorageSync('userId', userId)
    }

    // 更新页面数据
    this.setData({
      userInfo,
      userId
    })
  },

  // 加载统计数据的方法
  loadStats() {
    // 模拟统计数据（实际项目中应从后端API获取）
    this.setData({
      stats: {
        published: 5, // 发布了5个搭子
        joined: 8, // 参与了8个搭子
        followers: 23 // 有23个粉丝
      }
    })
  },

  // 生成用户ID的方法
  generateUserId() {
    // 生成以'D'开头，后面跟着8位随机字母数字的ID
    return 'D' + Math.random().toString(36).substr(2, 8).toUpperCase()
  },

  // 编辑个人资料的方法
  editProfile() {
    // 使用头像昵称填写能力（替代已废弃的 wx.getUserProfile）
    wx.getUserInfo({
      success: (res) => {
        wx.setStorageSync('userInfo', res.userInfo)
        this.setData({
          userInfo: res.userInfo
        })
        wx.showToast({
          title: '更新成功',
          icon: 'success'
        })
      },
      fail: () => {
        wx.showToast({
          title: '取消授权',
          icon: 'none'
        })
      }
    })
  },

  // 跳转到我的搭子页面的方法
  goToMyPartners() {
    // 显示功能开发中提示（实际项目中应跳转到对应页面）
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 跳转到消息通知页面的方法
  goToMessages() {
    // 显示功能开发中提示（实际项目中应跳转到对应页面）
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 跳转到我的收藏页面的方法
  goToFavorites() {
    // 显示功能开发中提示（实际项目中应跳转到对应页面）
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 跳转到历史记录页面的方法
  goToHistory() {
    // 显示功能开发中提示（实际项目中应跳转到对应页面）
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 跳转到设置页面的方法
  goToSettings() {
    // 显示功能开发中提示（实际项目中应跳转到对应页面）
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 显示关于我们弹窗的方法
  goToAbout() {
    // 显示关于信息的对话框
    wx.showModal({
      title: '关于搭牛牛',
      content: '搭牛牛是一个非盈利的旅行搭子匹配平台，帮助世界各地旅行的人找到志同道合的伙伴。我们致力于让旅行更有趣、更安全。',
      showCancel: false, // 不显示取消按钮
      confirmText: '我知道了'
    })
  },

  // 显示联系客服弹窗的方法
  contactUs() {
    // 显示联系客服信息的对话框
    wx.showModal({
      title: '联系客服',
      content: '客服邮箱：support@daxiaoniu.com\n工作时间：9:00-18:00',
      showCancel: false, // 不显示取消按钮
      confirmText: '我知道了'
    })
  }
})
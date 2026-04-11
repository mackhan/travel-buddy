App({
  onLaunch() {
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo) {
      this.getUserInfo()
    }
  },

  // 获取用户信息（使用头像昵称填写能力，替代已废弃的 wx.getUserProfile）
  getUserInfo() {
    wx.getUserInfo({
      success: (res) => {
        if (res.userInfo) {
          wx.setStorageSync('userInfo', res.userInfo)
          this.globalData.userInfo = res.userInfo
        }
      },
      fail: () => {
        // 用户拒绝授权，使用默认信息
        wx.setStorageSync('userInfo', {
          nickName: '游客',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Default'
        })
      }
    })
  },

  globalData: {
    userInfo: null,
    city: '',
    date: ''
  }
})
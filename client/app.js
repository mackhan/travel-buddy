// app.js
const { login, checkLogin } = require('./utils/auth')
const { MOCK_USER, MOCK_TOKEN } = require('./utils/mock')

App({
  globalData: {
    userInfo: null,
    token: null,
    baseUrl: 'https://express-37pl-245311-4-1421335349.sh.run.tcloudbase.com/api',
    socketUrl: 'wss://express-37pl-245311-4-1421335349.sh.run.tcloudbase.com',
    // 微信云托管配置
    cloudEnvId: 'prod-1gs49bco623f3144',
    cloudServiceName: 'express-37pl',
    // Mock 模式：后端不可达时自动启用
    mockMode: false
  },

  // 初始化 Promise — 页面可以 await 这个来确保初始化完成
  _readyResolve: null,
  _readyPromise: null,

  onLaunch() {
    const self = this
    this._readyPromise = new Promise((resolve) => {
      self._readyResolve = resolve
    })
    // 初始化云开发 SDK
    wx.cloud.init({
      env: this.globalData.cloudEnvId,
      traceUser: false
    })
    console.log('☁️ 云开发 SDK 已初始化，env:', this.globalData.cloudEnvId)
    // 开始检测后端
    this.detectBackend()
  },

  /**
   * 等待 App 初始化完成（供页面调用）
   * 用法：await getApp().ready()
   */
  ready() {
    return this._readyPromise
  },

  /**
   * 检测后端是否可达（带重试）
   */
  detectBackend(retryCount = 0) {
    const self = this
    if (retryCount === 0) {
      wx.showToast({ title: '连接服务器中...', icon: 'loading', duration: 30000, mask: false })
    }

    wx.cloud.callContainer({
      config: { env: this.globalData.cloudEnvId },
      path: '/api/health',
      method: 'GET',
      header: { 'X-WX-SERVICE': this.globalData.cloudServiceName },
      timeout: 20000,
      success(res) {
        wx.hideToast()
        if (res.statusCode === 200) {
          console.log('✅ 云托管后端已连接')
          wx.showToast({ title: '✅ 服务器已连接', icon: 'none', duration: 1500 })
          self.globalData.mockMode = false
          self.checkLoginStatus().then(() => self._readyResolve())
        } else {
          console.warn('⚠️ 后端响应异常，切换到 Mock 模式')
          wx.showToast({ title: '⚠️ 服务异常，使用演示数据', icon: 'none', duration: 2000 })
          self.enableMockMode()
          self._readyResolve()
        }
      },
      fail(err) {
        console.warn(`⚠️ 连接失败(第${retryCount + 1}次):`, err.errMsg)
        if (retryCount < 2) {
          // 最多重试 2 次
          setTimeout(() => self.detectBackend(retryCount + 1), 2000)
        } else {
          wx.hideToast()
          console.warn('⚠️ 云托管不可达，自动切换 Mock 模式')
          wx.showToast({ title: '⚠️ 无法连接服务器，使用演示数据', icon: 'none', duration: 2500 })
          self.enableMockMode()
          self._readyResolve()
        }
      }
    })
  },

  /**
   * 启用 Mock 模式 — 使用本地模拟数据
   */
  enableMockMode() {
    this.globalData.mockMode = true
    this.globalData.token = MOCK_TOKEN
    const userInfo = { ...MOCK_USER }
    this.globalData.userInfo = userInfo
    wx.setStorageSync('token', MOCK_TOKEN)
    wx.setStorageSync('userInfo', userInfo)
    console.log('🎭 Mock 模式已启用，使用模拟数据运行')
  },

  async checkLoginStatus() {
    // Mock 模式下不需要检查真实登录态
    if (this.globalData.mockMode) return

    try {
      const token = wx.getStorageSync('token')
      const userInfo = wx.getStorageSync('userInfo')
      if (token && userInfo) {
        this.globalData.token = token
        this.globalData.userInfo = userInfo
        // 验证 token 是否过期
        const valid = await checkLogin()
        if (!valid) {
          await this.doLogin()
        }
      } else {
        await this.doLogin()
      }
    } catch (e) {
      console.error('检查登录态失败', e)
      await this.doLogin()
    }
  },

  async doLogin() {
    // Mock 模式下不调用 wx.login
    if (this.globalData.mockMode) {
      this.enableMockMode()
      return
    }

    try {
      const res = await login()
      // 统一 id/_id 字段，确保全局一致
      const userInfo = res.userInfo || {}
      if (userInfo.id && !userInfo._id) userInfo._id = userInfo.id
      if (userInfo._id && !userInfo.id) userInfo.id = userInfo._id
      this.globalData.token = res.token
      this.globalData.userInfo = userInfo
      wx.setStorageSync('token', res.token)
      wx.setStorageSync('userInfo', userInfo)
    } catch (e) {
      console.error('登录失败', e)
      // 登录失败时降级到 Mock 模式
      if (!this.globalData.token) {
        console.warn('⚠️ 登录失败，降级到 Mock 模式')
        this.enableMockMode()
      }
    }
  }
})

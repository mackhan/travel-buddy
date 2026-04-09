// app.js
const { login, checkLogin } = require('./utils/auth')
const { MOCK_USER, MOCK_TOKEN } = require('./utils/mock')

App({
  globalData: {
    userInfo: null,
    token: null,
    baseUrl: 'http://localhost:3000/api',
    socketUrl: 'ws://localhost:3000',
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
   * 检测后端是否可达
   */
  detectBackend() {
    const self = this
    wx.request({
      url: `${this.globalData.baseUrl}/health`,
      method: 'GET',
      timeout: 3000,
      success(res) {
        if (res.statusCode === 200) {
          console.log('✅ 后端已连接')
          self.globalData.mockMode = false
          self.checkLoginStatus().then(() => {
            self._readyResolve()
          })
        } else {
          console.warn('⚠️ 后端响应异常，切换到 Mock 模式')
          self.enableMockMode()
          self._readyResolve()
        }
      },
      fail() {
        console.warn('⚠️ 后端不可达，自动切换 Mock 模式')
        self.enableMockMode()
        self._readyResolve()
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

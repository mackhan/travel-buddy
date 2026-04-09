// utils/auth.js - 微信登录态管理
// 注意：不能在模块顶层调用 getApp()，必须在函数内部获取

/**
 * 微信登录：wx.login 获取 code → 发送到后端换取 token
 */
function login() {
  const app = getApp()
  return new Promise((resolve, reject) => {
    wx.login({
      success(loginRes) {
        if (!loginRes.code) {
          reject(new Error('wx.login 未返回 code'))
          return
        }

        // 直接用 code 登录（wx.getUserProfile 已于 2022年10月废弃）
        wx.request({
          url: `${app.globalData.baseUrl}/auth/login`,
          method: 'POST',
          data: {
            code: loginRes.code
          },
          timeout: 5000,
          success(res) {
            if (res.statusCode === 200 && res.data.data && res.data.data.token) {
              resolve({
                token: res.data.data.token,
                userInfo: res.data.data.userInfo
              })
            } else if (res.statusCode === 200 && res.data.token) {
              resolve({
                token: res.data.token,
                userInfo: res.data.userInfo
              })
            } else {
              reject(new Error((res.data && res.data.message) || '登录失败'))
            }
          },
          fail(err) {
            // 后端不可达，由 app.js 的 catch 统一处理降级
            reject(new Error('后端不可达: ' + (err.errMsg || '')))
          }
        })
      },
      fail(err) {
        // wx.login 失败（可能是没有真实 AppID），由 app.js 统一降级
        reject(new Error('wx.login 失败: ' + (err.errMsg || '')))
      }
    })
  })
}

/**
 * 检查登录态是否有效
 */
function checkLogin() {
  const app = getApp()

  // Mock 模式下直接返回 true
  if (app.globalData.mockMode) {
    return Promise.resolve(true)
  }

  return new Promise((resolve) => {
    const token = wx.getStorageSync('token')
    if (!token) {
      resolve(false)
      return
    }

    wx.request({
      url: `${app.globalData.baseUrl}/auth/check`,
      method: 'GET',
      header: { Authorization: `Bearer ${token}` },
      timeout: 5000,
      success(res) {
        resolve(res.statusCode === 200)
      },
      fail() {
        resolve(false)
      }
    })
  })
}

/**
 * 退出登录
 */
function logout() {
  const app = getApp()
  wx.removeStorageSync('token')
  wx.removeStorageSync('userInfo')
  app.globalData.token = null
  app.globalData.userInfo = null
  app.globalData.mockMode = false
}

module.exports = { login, checkLogin, logout }

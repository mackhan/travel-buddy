// utils/auth.js - 微信登录态管理（使用 wx.cloud.callContainer）

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

        wx.cloud.callContainer({
          config: { env: app.globalData.cloudEnvId },
          path: '/api/auth/login',
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'X-WX-SERVICE': app.globalData.cloudServiceName
          },
          data: JSON.stringify({ code: loginRes.code }),
          success(res) {
            console.log('🔍 登录响应:', JSON.stringify(res))
            if (res.statusCode === 200 && res.data && res.data.data && res.data.data.token) {
              resolve({ token: res.data.data.token, userInfo: res.data.data.userInfo })
            } else if (res.statusCode === 200 && res.data && res.data.token) {
              resolve({ token: res.data.token, userInfo: res.data.userInfo })
            } else {
              reject(new Error((res.data && res.data.message) || `登录失败(${res.statusCode})`))
            }
          },
          fail(err) {
            console.error('🔍 登录网络错误:', JSON.stringify(err))
            reject(new Error('后端不可达: ' + (err.errMsg || '')))
          }
        })
      },
      fail(err) {
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

  if (app.globalData.mockMode) return Promise.resolve(true)

  return new Promise((resolve) => {
    const token = wx.getStorageSync('token')
    if (!token) { resolve(false); return }

    wx.cloud.callContainer({
      config: { env: app.globalData.cloudEnvId },
      path: '/api/auth/check',
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`,
        'X-WX-SERVICE': app.globalData.cloudServiceName
      },
      success(res) { resolve(res.statusCode === 200) },
      fail() { resolve(false) }
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

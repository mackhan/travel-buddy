// utils/request.js - HTTP 请求封装
// 注意：不能在模块顶层调用 getApp()，必须在函数内部获取
const { mockRequest } = require('./mock')

/**
 * 统一请求封装
 * @param {Object} options - 请求配置
 * @param {string} options.url - 请求路径（不含 baseUrl）
 * @param {string} options.method - 请求方法
 * @param {Object} options.data - 请求数据
 * @param {boolean} options.auth - 是否携带 token，默认 true
 */
function request({ url, method = 'GET', data = {}, auth = true, _retryCount = 0 }) {
  const app = getApp()

  // ===== Mock 模式：直接返回模拟数据 =====
  if (app.globalData.mockMode) {
    return new Promise((resolve) => {
      const fullUrl = `${app.globalData.baseUrl}${url}`
      const mockRes = mockRequest(fullUrl, method, data)
      // 模拟一点网络延迟，让 loading 状态能展示
      setTimeout(() => {
        resolve(mockRes.data)
      }, 200)
    })
  }

  // ===== 正常模式：发真实请求 =====
  return new Promise((resolve, reject) => {
    const header = {
      'Content-Type': 'application/json'
    }

    if (auth && app.globalData.token) {
      header['Authorization'] = `Bearer ${app.globalData.token}`
    }

    wx.request({
      url: `${app.globalData.baseUrl}${url}`,
      method,
      data,
      header,
      timeout: 10000,
      success(res) {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else if (res.statusCode === 401 && _retryCount < 1) {
          // token 过期，重新登录后重试（最多重试1次，防止无限循环）
          app.doLogin().then(() => {
            request({ url, method, data, auth, _retryCount: _retryCount + 1 }).then(resolve).catch(reject)
          }).catch(reject)
        } else if (res.statusCode === 401) {
          // 重试后仍然 401，跳到登录
          wx.showToast({ title: '登录已过期，请重新打开', icon: 'none' })
          reject(new Error('登录态无效'))
        } else {
          const errMsg = (res.data && res.data.message) || '请求失败'
          wx.showToast({ title: errMsg, icon: 'none' })
          reject(new Error(errMsg))
        }
      },
      fail(err) {
        // 连接失败时自动降级到 Mock 模式
        console.warn('⚠️ 请求失败，自动降级到 Mock 模式:', url)
        app.globalData.mockMode = true
        const fullUrl = `${app.globalData.baseUrl}${url}`
        const mockRes = mockRequest(fullUrl, method, data)
        resolve(mockRes.data)
      }
    })
  })
}

// 快捷方法
const get = (url, data) => request({ url, method: 'GET', data })
const post = (url, data) => request({ url, method: 'POST', data })
const put = (url, data) => request({ url, method: 'PUT', data })
const del = (url, data) => request({ url, method: 'DELETE', data })

module.exports = { request, get, post, put, del }

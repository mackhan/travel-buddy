// utils/request.js - HTTP 请求封装（使用 wx.cloud.callContainer，无需配置合法域名）
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
      setTimeout(() => resolve(mockRes.data), 200)
    })
  }

  // ===== 正常模式：通过云托管发请求（无需合法域名） =====
  return new Promise((resolve, reject) => {
    const header = { 'Content-Type': 'application/json' }
    if (auth && app.globalData.token) {
      header['Authorization'] = `Bearer ${app.globalData.token}`
    }

    wx.cloud.callContainer({
      config: { env: app.globalData.cloudEnvId },
      path: `/api${url}`,
      method,
      header: {
        ...header,
        'X-WX-SERVICE': app.globalData.cloudServiceName
      },
      data,
      success(res) {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else if (res.statusCode === 401 && _retryCount < 1) {
          app.doLogin().then(() => {
            request({ url, method, data, auth, _retryCount: _retryCount + 1 }).then(resolve).catch(reject)
          }).catch(reject)
        } else if (res.statusCode === 401) {
          wx.showToast({ title: '登录已过期，请重新打开', icon: 'none' })
          reject(new Error('登录态无效'))
        } else {
          const errMsg = (res.data && res.data.message) || '请求失败'
          wx.showToast({ title: errMsg, icon: 'none' })
          reject(new Error(errMsg))
        }
      },
      fail(err) {
        console.warn('⚠️ 云托管请求失败，自动降级到 Mock 模式:', url, err)
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

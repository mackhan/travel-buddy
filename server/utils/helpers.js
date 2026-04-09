// utils/helpers.js - 后端工具函数

/**
 * 统一成功响应格式
 */
function success(res, data = null, message = 'ok') {
  return res.json({ code: 0, message, data })
}

/**
 * 统一错误响应格式
 */
function fail(res, message = '操作失败', status = 400) {
  return res.status(status).json({ code: -1, message })
}

/**
 * 分页参数解析
 */
function parsePagination(query, defaults = { page: 1, limit: 20 }) {
  let page = parseInt(query.page) || defaults.page
  let limit = parseInt(query.limit) || defaults.limit
  page = Math.max(1, page)
  limit = Math.min(Math.max(1, limit), 100)
  const skip = (page - 1) * limit
  return { page, limit, skip }
}

/**
 * 游标分页解析（基于时间戳）
 */
function parseCursorPagination(query, defaults = { limit: 20 }) {
  const limit = Math.min(Math.max(1, parseInt(query.limit) || defaults.limit), 100)
  const cursor = query.cursor ? new Date(query.cursor) : null
  return { limit, cursor }
}

module.exports = { success, fail, parsePagination, parseCursorPagination }

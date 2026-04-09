// utils/util.js - 通用工具函数

/**
 * 日期格式化
 * @param {Date|string|number} date
 * @param {string} fmt - 格式模板，如 'YYYY-MM-DD'
 */
function formatDate(date, fmt = 'YYYY-MM-DD') {
  if (!date) return ''
  const d = new Date(date)
  const map = {
    'YYYY': d.getFullYear(),
    'MM': String(d.getMonth() + 1).padStart(2, '0'),
    'DD': String(d.getDate()).padStart(2, '0'),
    'HH': String(d.getHours()).padStart(2, '0'),
    'mm': String(d.getMinutes()).padStart(2, '0'),
    'ss': String(d.getSeconds()).padStart(2, '0')
  }
  let result = fmt
  Object.keys(map).forEach(key => {
    result = result.replace(key, map[key])
  })
  return result
}

/**
 * 相对时间（几分钟前、几小时前等）
 */
function timeAgo(date) {
  const now = Date.now()
  const diff = now - new Date(date).getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)}分钟前`
  if (diff < day) return `${Math.floor(diff / hour)}小时前`
  if (diff < 7 * day) return `${Math.floor(diff / day)}天前`
  return formatDate(date, 'MM-DD')
}

/**
 * 金额格式化（分 → 元）
 * @param {number} cents - 以分为单位的金额
 */
function formatMoney(cents) {
  if (typeof cents !== 'number') return '0.00'
  return (cents / 100).toFixed(2)
}

/**
 * 元转分
 */
function yuanToCents(yuan) {
  return Math.round(parseFloat(yuan) * 100)
}

/**
 * AA 均摊计算（以分为单位，余数归创建者）
 * @param {number} totalCents - 总金额（分）
 * @param {number} count - 参与人数
 * @returns {number[]} 每人应付金额数组
 */
function splitEqual(totalCents, count) {
  if (count <= 0) return []
  const base = Math.floor(totalCents / count)
  const remainder = totalCents - base * count
  const result = new Array(count).fill(base)
  // 余数归第一个人（创建者）
  result[0] += remainder
  return result
}

/**
 * 计算信誉分星级
 * @param {number} score - 信誉分（0-5）
 * @returns {Object} { full, half, empty }
 */
function getStars(score) {
  const s = Math.max(0, Math.min(5, score || 5))
  const full = Math.floor(s)
  const half = s - full >= 0.5 ? 1 : 0
  const empty = 5 - full - half
  return { full, half, empty, score: s.toFixed(1) }
}

/**
 * 标签列表
 */
const TAG_LIST = [
  { key: 'car', label: '拼车', icon: '🚗' },
  { key: 'room', label: '拼房', icon: '🏨' },
  { key: 'trip', label: '拼行程', icon: '🗺️' },
  { key: 'food', label: '拼饭', icon: '🍜' },
  { key: 'ticket', label: '拼门票', icon: '🎫' }
]

/**
 * 防抖
 */
function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

/**
 * 生成对话 ID（两个用户 ID 排序拼接）
 */
function getConversationId(userId1, userId2) {
  return [userId1, userId2].sort().join('_')
}

module.exports = {
  formatDate,
  timeAgo,
  formatMoney,
  yuanToCents,
  splitEqual,
  getStars,
  TAG_LIST,
  debounce,
  getConversationId
}

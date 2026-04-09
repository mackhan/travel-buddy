// controllers/userController.js - 用户控制器
const User = require('../models/User')
const { success, fail } = require('../utils/helpers')

/**
 * 获取当前用户资料
 * GET /api/users/me
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-openid')
    if (!user) return fail(res, '用户不存在', 404)
    success(res, user)
  } catch (err) {
    fail(res, '获取资料失败', 500)
  }
}

/**
 * 更新个人资料
 * PUT /api/users/me
 */
exports.updateProfile = async (req, res) => {
  try {
    const allowedFields = ['nickname', 'avatar', 'gender', 'age', 'bio', 'travelPrefs']
    const updates = {}
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field]
      }
    })

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-openid')

    if (!user) return fail(res, '用户不存在', 404)
    success(res, user)
  } catch (err) {
    fail(res, '更新资料失败', 500)
  }
}

/**
 * 获取指定用户公开资料
 * GET /api/users/:id
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('nickname avatar gender age bio creditScore reviewCount tripCount createdAt')
    if (!user) return fail(res, '用户不存在', 404)
    success(res, user)
  } catch (err) {
    fail(res, '获取用户信息失败', 500)
  }
}

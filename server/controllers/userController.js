// controllers/userController.js
const User = require('../models/User')
const { success, fail } = require('../utils/helpers')

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, { attributes: { exclude: ['openid'] } })
    if (!user) return fail(res, '用户不存在', 404)
    success(res, user)
  } catch (err) { fail(res, '获取资料失败', 500) }
}

exports.updateProfile = async (req, res) => {
  try {
    const allowed = ['nickname', 'avatar', 'gender', 'age', 'bio', 'travelPrefs']
    const updates = {}
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f] })

    const user = await User.findByPk(req.userId)
    if (!user) return fail(res, '用户不存在', 404)
    await user.update(updates)
    const updated = user.toJSON()
    delete updated.openid
    success(res, updated)
  } catch (err) { fail(res, '更新资料失败', 500) }
}

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'nickname', 'avatar', 'gender', 'age', 'bio', 'creditScore', 'reviewCount', 'tripCount', 'createdAt']
    })
    if (!user) return fail(res, '用户不存在', 404)
    success(res, user)
  } catch (err) { fail(res, '获取用户信息失败', 500) }
}

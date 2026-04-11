// controllers/reviewController.js
const Review = require('../models/Review')
const User = require('../models/User')
const Trip = require('../models/Trip')
const { success, fail, parsePagination } = require('../utils/helpers')

exports.create = async (req, res) => {
  try {
    const { toUserId, tripId, score, content } = req.body
    if (!toUserId || !tripId || !score) return fail(res, '请填写完整的评价信息')
    if (toUserId === req.userId) return fail(res, '不能评价自己')
    if (score < 1 || score > 5) return fail(res, '评分范围为 1-5 分')

    const exists = await Review.findOne({ where: { fromUserId: req.userId, toUserId, tripId } })
    if (exists) return fail(res, '您已评价过该行程的搭子')

    const review = await Review.create({ fromUserId: req.userId, toUserId, tripId, score, content: content || '' })

    const targetUser = await User.findByPk(toUserId)
    if (targetUser) {
      const total = targetUser.creditScore * targetUser.reviewCount + score
      const newCount = targetUser.reviewCount + 1
      await targetUser.update({ reviewCount: newCount, creditScore: Math.round((total / newCount) * 10) / 10 })
    }

    success(res, review, '评价成功')
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') return fail(res, '请勿重复评价')
    console.error('评价失败:', err); fail(res, '评价失败', 500)
  }
}

exports.getByUser = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query)
    const { count, rows } = await Review.findAndCountAll({
      where: { toUserId: req.params.userId },
      order: [['createdAt', 'DESC']], offset: skip, limit,
      include: [
        { model: User, as: 'fromUser', attributes: ['id', 'nickname', 'avatar'] },
        { model: Trip, as: 'trip', attributes: ['id', 'destination', 'startDate', 'endDate'] }
      ]
    })
    success(res, { list: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } })
  } catch (err) { fail(res, '获取评价失败', 500) }
}

exports.getMine = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query)
    const { count, rows } = await Review.findAndCountAll({
      where: { fromUserId: req.userId },
      order: [['createdAt', 'DESC']], offset: skip, limit,
      include: [
        { model: User, as: 'toUser', attributes: ['id', 'nickname', 'avatar'] },
        { model: Trip, as: 'trip', attributes: ['id', 'destination', 'startDate', 'endDate'] }
      ]
    })
    success(res, { list: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } })
  } catch (err) { fail(res, '获取评价失败', 500) }
}

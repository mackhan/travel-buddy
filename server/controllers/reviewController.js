// controllers/reviewController.js
const { Op } = require('sequelize')
const sequelize = require('../db')
const Review = require('../models/Review')
const User = require('../models/User')
const Trip = require('../models/Trip')
const TripMember = require('../models/TripMember')
const { success, fail, parsePagination } = require('../utils/helpers')

exports.create = async (req, res) => {
  try {
    const { toUserId, tripId, score, content } = req.body
    if (!toUserId || !tripId || !score) return fail(res, '请填写完整的评价信息')
    if (parseInt(toUserId) === req.userId) return fail(res, '不能评价自己')
    if (score < 1 || score > 5) return fail(res, '评分范围为 1-5 分')

    // 校验行程状态
    const trip = await Trip.findByPk(tripId)
    if (!trip) return fail(res, '行程不存在', 404)
    if (trip.status !== 'completed') return fail(res, '行程未完成，暂不开放评价')

    // 校验评价发起人资格：必须是行程发布者，或已 approved 的成员
    const isRequesterOwner = trip.userId === req.userId
    if (!isRequesterOwner) {
      const requesterMember = await TripMember.findOne({
        where: { tripId, userId: req.userId, status: 'approved' }
      })
      if (!requesterMember) return fail(res, '您未参与该行程，无法评价', 403)
    }

    // 校验被评价人资格：必须是行程发布者，或已 approved 的成员
    const isTargetOwner = trip.userId === parseInt(toUserId)
    if (!isTargetOwner) {
      const targetMember = await TripMember.findOne({
        where: { tripId, userId: toUserId, status: 'approved' }
      })
      if (!targetMember) return fail(res, '被评价人未参与该行程', 403)
    }

    const exists = await Review.findOne({ where: { fromUserId: req.userId, toUserId, tripId } })
    if (exists) return fail(res, '您已评价过该行程的搭子')

    const review = await Review.create({ fromUserId: req.userId, toUserId, tripId, score: parseFloat(score), content: content || '' })

    // 原子 SQL 更新信用分，防止竞态条件
    await sequelize.query(
      `UPDATE users SET
        review_count = review_count + 1,
        credit_score = ROUND((credit_score * review_count + :score) / (review_count + 1), 1)
       WHERE id = :id`,
      { replacements: { score: parseFloat(score), id: toUserId } }
    )

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

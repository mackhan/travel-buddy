// controllers/reviewController.js - 评价控制器
const Review = require('../models/Review')
const User = require('../models/User')
const { success, fail, parsePagination } = require('../utils/helpers')

/**
 * 提交评价
 * POST /api/reviews
 */
exports.create = async (req, res) => {
  try {
    const { toUserId, tripId, score, content } = req.body

    if (!toUserId || !tripId || !score) {
      return fail(res, '请填写完整的评价信息')
    }

    if (toUserId === req.userId) {
      return fail(res, '不能评价自己')
    }

    if (score < 1 || score > 5) {
      return fail(res, '评分范围为 1-5 分')
    }

    // 检查是否已评价
    const exists = await Review.findOne({
      fromUserId: req.userId,
      toUserId,
      tripId
    })
    if (exists) {
      return fail(res, '您已评价过该行程的搭子')
    }

    const review = await Review.create({
      fromUserId: req.userId,
      toUserId,
      tripId,
      score,
      content: content || ''
    })

    // 更新被评价者的信誉分（增量计算）
    const targetUser = await User.findById(toUserId)
    if (targetUser) {
      const totalScore = targetUser.creditScore * targetUser.reviewCount + score
      targetUser.reviewCount += 1
      targetUser.creditScore = Math.round((totalScore / targetUser.reviewCount) * 10) / 10
      await targetUser.save()
    }

    success(res, review, '评价成功')
  } catch (err) {
    if (err.code === 11000) {
      return fail(res, '请勿重复评价')
    }
    console.error('评价失败:', err)
    fail(res, '评价失败', 500)
  }
}

/**
 * 获取某用户收到的评价
 * GET /api/reviews/user/:userId
 */
exports.getByUser = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query)
    const filter = { toUserId: req.params.userId }

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('fromUserId', 'nickname avatar')
        .populate('tripId', 'destination startDate endDate')
        .lean(),
      Review.countDocuments(filter)
    ])

    success(res, {
      list: reviews,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (err) {
    fail(res, '获取评价失败', 500)
  }
}

/**
 * 获取我发出的评价
 * GET /api/reviews/mine
 */
exports.getMine = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query)
    const filter = { fromUserId: req.userId }

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('toUserId', 'nickname avatar')
        .populate('tripId', 'destination startDate endDate')
        .lean(),
      Review.countDocuments(filter)
    ])

    success(res, {
      list: reviews,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (err) {
    fail(res, '获取评价失败', 500)
  }
}

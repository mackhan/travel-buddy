// controllers/tripController.js - 行程控制器
const Trip = require('../models/Trip')
const User = require('../models/User')
const { success, fail, parsePagination } = require('../utils/helpers')

/**
 * 发布行程
 * POST /api/trips
 */
exports.create = async (req, res) => {
  try {
    const { destination, startDate, endDate, tags, description, maxMembers } = req.body

    if (!destination || !startDate || !endDate || !tags || tags.length === 0) {
      return fail(res, '请填写完整的行程信息')
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return fail(res, '结束时间必须晚于出发时间')
    }

    if (new Date(startDate) < new Date()) {
      return fail(res, '出发时间不能早于当前时间')
    }

    const trip = await Trip.create({
      userId: req.userId,
      destination: destination.trim(),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      tags,
      description: description || '',
      maxMembers: maxMembers || 0
    })

    // 更新用户行程数
    await User.findByIdAndUpdate(req.userId, { $inc: { tripCount: 1 } })

    success(res, trip, '行程发布成功')
  } catch (err) {
    console.error('发布行程失败:', err)
    fail(res, '发布失败，请稍后重试', 500)
  }
}

/**
 * 搜索匹配行程
 * GET /api/trips/search
 * query: { destination, startDate, endDate, tags(逗号分隔), page, limit }
 */
exports.search = async (req, res) => {
  try {
    const { destination, startDate, endDate, tags } = req.query
    const { page, limit, skip } = parsePagination(req.query)

    const filter = {
      status: 'active',
      userId: { $ne: req.userId }  // 排除自己的行程
    }

    // 目的地搜索（模糊匹配）
    if (destination) {
      filter.destination = { $regex: destination.trim(), $options: 'i' }
    }

    // 时间段重叠查询
    if (startDate && endDate) {
      filter.startDate = { $lte: new Date(endDate) }
      filter.endDate = { $gte: new Date(startDate) }
    } else if (startDate) {
      filter.endDate = { $gte: new Date(startDate) }
    } else if (endDate) {
      filter.startDate = { $lte: new Date(endDate) }
    }

    // 标签筛选
    if (tags) {
      const tagArr = tags.split(',').filter(Boolean)
      if (tagArr.length > 0) {
        filter.tags = { $in: tagArr }
      }
    }

    const [trips, total] = await Promise.all([
      Trip.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'nickname avatar creditScore')
        .lean(),
      Trip.countDocuments(filter)
    ])

    success(res, {
      list: trips,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (err) {
    console.error('搜索行程失败:', err)
    fail(res, '搜索失败', 500)
  }
}

/**
 * 获取热门行程（首页默认展示）
 * GET /api/trips/hot
 */
exports.getHot = async (req, res) => {
  try {
    const { limit } = parsePagination(req.query, { page: 1, limit: 10 })

    const trips = await Trip.find({
      status: 'active',
      endDate: { $gte: new Date() }
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'nickname avatar creditScore')
      .lean()

    success(res, trips)
  } catch (err) {
    fail(res, '获取行程失败', 500)
  }
}

/**
 * 行程详情
 * GET /api/trips/:id
 */
exports.getById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('userId', 'nickname avatar gender age bio creditScore reviewCount')
      .lean()

    if (!trip) return fail(res, '行程不存在', 404)
    success(res, trip)
  } catch (err) {
    fail(res, '获取行程详情失败', 500)
  }
}

/**
 * 我的行程列表
 * GET /api/trips/mine
 */
exports.getMine = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query)
    const status = req.query.status || null

    const filter = { userId: req.userId }
    if (status) filter.status = status

    const [trips, total] = await Promise.all([
      Trip.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Trip.countDocuments(filter)
    ])

    success(res, {
      list: trips,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (err) {
    fail(res, '获取我的行程失败', 500)
  }
}

/**
 * 更新行程状态
 * PUT /api/trips/:id
 */
exports.update = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.userId })
    if (!trip) return fail(res, '行程不存在或无权操作', 404)

    const allowedFields = ['destination', 'startDate', 'endDate', 'tags', 'description', 'status', 'maxMembers']
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        trip[field] = req.body[field]
      }
    })

    await trip.save()
    success(res, trip, '行程已更新')
  } catch (err) {
    fail(res, '更新失败', 500)
  }
}

/**
 * 删除行程
 * DELETE /api/trips/:id
 */
exports.remove = async (req, res) => {
  try {
    const trip = await Trip.findOneAndDelete({ _id: req.params.id, userId: req.userId })
    if (!trip) return fail(res, '行程不存在或无权操作', 404)
    await User.findByIdAndUpdate(req.userId, { $inc: { tripCount: -1 } })
    success(res, null, '行程已删除')
  } catch (err) {
    fail(res, '删除失败', 500)
  }
}

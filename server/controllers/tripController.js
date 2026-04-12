// controllers/tripController.js
const { Op } = require('sequelize')
const Trip = require('../models/Trip')
const User = require('../models/User')
const { success, fail, parsePagination } = require('../utils/helpers')

const userAttrs = ['id', 'nickname', 'avatar', 'creditScore']

exports.create = async (req, res) => {
  try {
    const { destination, title, startDate, endDate, tags, description, maxMembers } = req.body
    if (!destination || !startDate || !endDate || !tags || tags.length === 0)
      return fail(res, '请填写完整的行程信息')
    if (new Date(startDate) >= new Date(endDate)) return fail(res, '结束时间必须晚于出发时间')
    const today = new Date().toISOString().split('T')[0]
    if (startDate < today) return fail(res, '出发时间不能早于当前时间')

    const trip = await Trip.create({ userId: req.userId, destination: destination.trim(), title: (title || '').trim(), startDate, endDate, tags, description: description || '', maxMembers: maxMembers || 0 })
    await User.increment('tripCount', { where: { id: req.userId } })
    success(res, trip, '行程发布成功')
  } catch (err) { console.error('发布行程失败:', err.message, err.stack); fail(res, `发布失败: ${err.message}`, 500) }
}

exports.search = async (req, res) => {
  try {
    const { destination, startDate, endDate, tags } = req.query
    const { page, limit, skip } = parsePagination(req.query)
    const where = { status: 'active', userId: { [Op.ne]: req.userId } }

    if (destination) where.destination = { [Op.like]: `%${destination.trim()}%` }
    if (startDate && endDate) { where.startDate = { [Op.lte]: new Date(endDate) }; where.endDate = { [Op.gte]: new Date(startDate) } }
    else if (startDate) where.endDate = { [Op.gte]: new Date(startDate) }
    else if (endDate) where.startDate = { [Op.lte]: new Date(endDate) }

    const { count, rows } = await Trip.findAndCountAll({
      where, offset: skip, limit, order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'user', attributes: userAttrs }]
    })
    success(res, { list: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } })
  } catch (err) { fail(res, '搜索失败', 500) }
}

exports.getHot = async (req, res) => {
  try {
    const { limit } = parsePagination(req.query, { page: 1, limit: 10 })
    const trips = await Trip.findAll({
      where: { status: 'active', endDate: { [Op.gte]: new Date() } },
      order: [['createdAt', 'DESC']], limit,
      include: [{ model: User, as: 'user', attributes: userAttrs }]
    })
    success(res, trips)
  } catch (err) { fail(res, '获取行程失败', 500) }
}

exports.getById = async (req, res) => {
  try {
    const trip = await Trip.findByPk(req.params.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'nickname', 'avatar', 'gender', 'age', 'bio', 'creditScore', 'reviewCount'] }]
    })
    if (!trip) return fail(res, '行程不存在', 404)
    success(res, trip)
  } catch (err) { fail(res, '获取行程详情失败', 500) }
}

exports.getMine = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query)
    const where = { userId: req.userId }
    if (req.query.status) where.status = req.query.status
    const { count, rows } = await Trip.findAndCountAll({ where, offset: skip, limit, order: [['createdAt', 'DESC']] })
    success(res, { list: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } })
  } catch (err) { fail(res, '获取我的行程失败', 500) }
}

exports.update = async (req, res) => {
  try {
    const trip = await Trip.findOne({ where: { id: req.params.id, userId: req.userId } })
    if (!trip) return fail(res, '行程不存在或无权操作', 404)
    const allowed = ['destination', 'startDate', 'endDate', 'tags', 'description', 'status', 'maxMembers']
    const updates = {}
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f] })
    await trip.update(updates)
    success(res, trip, '行程已更新')
  } catch (err) { fail(res, '更新失败', 500) }
}

exports.join = async (req, res) => {
  try {
    const trip = await Trip.findByPk(req.params.id)
    if (!trip) return fail(res, '行程不存在', 404)
    if (trip.userId === req.userId) return fail(res, '不能加入自己的行程')
    success(res, { joined: true }, '加入成功')
  } catch (err) { fail(res, '加入失败', 500) }
}

exports.remove = async (req, res) => {
  try {
    const trip = await Trip.findOne({ where: { id: req.params.id, userId: req.userId } })
    if (!trip) return fail(res, '行程不存在或无权操作', 404)
    await trip.destroy()
    await User.decrement('tripCount', { where: { id: req.userId } })
    success(res, null, '行程已删除')
  } catch (err) { fail(res, '删除失败', 500) }
}

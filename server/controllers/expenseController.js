// controllers/expenseController.js
const Expense = require('../models/Expense')
const User = require('../models/User')
const { success, fail, parsePagination } = require('../utils/helpers')

exports.create = async (req, res) => {
  try {
    const { title, totalAmount, splitMode, participants, tripId } = req.body
    if (!title || !totalAmount || !participants || participants.length < 2)
      return fail(res, '请填写完整的分摊信息（至少2人参与）')

    const totalCents = Math.round(totalAmount)
    if (totalCents <= 0) return fail(res, '金额必须大于 0')

    let list = participants.map(p => ({ userId: p.userId, amount: p.amount || 0, paid: p.paid || false }))
    if (splitMode === 'equal' || !splitMode) {
      const base = Math.floor(totalCents / list.length)
      const rem = totalCents - base * list.length
      list = list.map((p, i) => ({ ...p, amount: base + (i === 0 ? rem : 0) }))
    } else {
      const sum = list.reduce((s, p) => s + p.amount, 0)
      if (sum !== totalCents) return fail(res, '自定义金额之和必须等于总金额')
    }

    const expense = await Expense.create({ creatorId: req.userId, tripId: tripId || null, title: title.trim(), totalAmount: totalCents, splitMode: splitMode || 'equal', participants: list })
    success(res, expense, '分摊单创建成功')
  } catch (err) { console.error('创建分摊单失败:', err); fail(res, '创建失败', 500) }
}

exports.getList = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query)
    const sequelize = require('../db')
    // participants 是 JSON 字段，用 LIKE 过滤当前用户
    const { count, rows } = await Expense.findAndCountAll({
      where: sequelize.literal(`creator_id = ${req.userId} OR JSON_CONTAINS(participants, JSON_OBJECT('userId', ${req.userId}))`),
      order: [['createdAt', 'DESC']], offset: skip, limit,
      include: [{ model: User, as: 'creator', attributes: ['id', 'nickname', 'avatar'] }]
    })
    success(res, { list: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } })
  } catch (err) { fail(res, '获取分摊单失败', 500) }
}

exports.getById = async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'nickname', 'avatar'] }]
    })
    if (!expense) return fail(res, '分摊单不存在', 404)
    success(res, expense)
  } catch (err) { fail(res, '获取详情失败', 500) }
}

exports.markPaid = async (req, res) => {
  try {
    const { userId } = req.body
    const targetUserId = userId || req.userId
    const expense = await Expense.findByPk(req.params.id)
    if (!expense) return fail(res, '分摊单不存在', 404)
    if (expense.creatorId !== req.userId && targetUserId !== req.userId) return fail(res, '无权操作')

    const list = expense.participants
    const p = list.find(p => p.userId === targetUserId)
    if (!p) return fail(res, '该用户不在分摊名单中')
    p.paid = true
    const allPaid = list.every(p => p.paid)
    await expense.update({ participants: list, ...(allPaid && { status: 'settled' }) })
    success(res, expense, '已标记支付')
  } catch (err) { fail(res, '操作失败', 500) }
}

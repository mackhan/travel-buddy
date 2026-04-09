// controllers/expenseController.js - 费用分摊控制器
const Expense = require('../models/Expense')
const { success, fail, parsePagination } = require('../utils/helpers')

/**
 * 创建分摊单
 * POST /api/expenses
 */
exports.create = async (req, res) => {
  try {
    const { title, totalAmount, splitMode, participants, tripId } = req.body

    if (!title || !totalAmount || !participants || participants.length < 2) {
      return fail(res, '请填写完整的分摊信息（至少2人参与）')
    }

    // 验证金额（以分为单位传入）
    const totalCents = Math.round(totalAmount)
    if (totalCents <= 0) {
      return fail(res, '金额必须大于 0')
    }

    let participantList = participants.map(p => ({
      userId: p.userId,
      amount: p.amount || 0,
      paid: p.paid || false
    }))

    // 均摊模式自动计算
    if (splitMode === 'equal' || !splitMode) {
      const count = participantList.length
      const base = Math.floor(totalCents / count)
      const remainder = totalCents - base * count
      participantList = participantList.map((p, i) => ({
        ...p,
        amount: base + (i === 0 ? remainder : 0)
      }))
    } else {
      // 自定义模式校验总额
      const sum = participantList.reduce((s, p) => s + p.amount, 0)
      if (sum !== totalCents) {
        return fail(res, '自定义金额之和必须等于总金额')
      }
    }

    const expense = await Expense.create({
      creatorId: req.userId,
      tripId: tripId || null,
      title: title.trim(),
      totalAmount: totalCents,
      splitMode: splitMode || 'equal',
      participants: participantList
    })

    success(res, expense, '分摊单创建成功')
  } catch (err) {
    console.error('创建分摊单失败:', err)
    fail(res, '创建失败', 500)
  }
}

/**
 * 获取我相关的分摊单
 * GET /api/expenses
 */
exports.getList = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query)

    const filter = {
      $or: [
        { creatorId: req.userId },
        { 'participants.userId': req.userId }
      ]
    }

    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('creatorId', 'nickname avatar')
        .populate('participants.userId', 'nickname avatar')
        .lean(),
      Expense.countDocuments(filter)
    ])

    success(res, {
      list: expenses,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (err) {
    fail(res, '获取分摊单失败', 500)
  }
}

/**
 * 获取分摊单详情
 * GET /api/expenses/:id
 */
exports.getById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('creatorId', 'nickname avatar')
      .populate('participants.userId', 'nickname avatar')
      .lean()

    if (!expense) return fail(res, '分摊单不存在', 404)
    success(res, expense)
  } catch (err) {
    fail(res, '获取详情失败', 500)
  }
}

/**
 * 更新支付状态
 * PUT /api/expenses/:id/pay
 */
exports.markPaid = async (req, res) => {
  try {
    const { userId } = req.body
    const targetUserId = userId || req.userId

    const expense = await Expense.findById(req.params.id)
    if (!expense) return fail(res, '分摊单不存在', 404)

    // 只有创建者或本人可以标记
    if (expense.creatorId.toString() !== req.userId && targetUserId !== req.userId) {
      return fail(res, '无权操作')
    }

    const participant = expense.participants.find(
      p => p.userId.toString() === targetUserId
    )
    if (!participant) return fail(res, '该用户不在分摊名单中')

    participant.paid = true

    // 检查是否全部结清
    const allPaid = expense.participants.every(p => p.paid)
    if (allPaid) expense.status = 'settled'

    await expense.save()
    success(res, expense, '已标记支付')
  } catch (err) {
    fail(res, '操作失败', 500)
  }
}

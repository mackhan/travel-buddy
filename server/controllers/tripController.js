// controllers/tripController.js
const { Op } = require('sequelize')
const sequelize = require('../db')
const Trip = require('../models/Trip')
const User = require('../models/User')
const TripMember = require('../models/TripMember')
const Message = require('../models/Message')
const { sendToUsers, sendToUser } = require('../services/socketService')
const { success, fail, parsePagination } = require('../utils/helpers')

const userAttrs = ['id', 'nickname', 'avatar', 'creditScore', 'reviewCount']

exports.create = async (req, res) => {
  try {
    const { destination, title, startDate, endDate, tags, description, maxMembers } = req.body
    if (!destination || !startDate || !endDate || !tags || tags.length === 0)
      return fail(res, '请填写完整的行程信息')
    if (new Date(startDate) >= new Date(endDate)) return fail(res, '结束时间必须晚于出发时间')
    const today = new Date().toISOString().split('T')[0]
    if (startDate < today) return fail(res, '出发时间不能早于当前时间')

    const trip = await Trip.create({
      userId: req.userId,
      destination: destination.trim(),
      title: (title || '').trim(),
      startDate, endDate, tags,
      description: description || '',
      maxMembers: maxMembers || 0,
      currentMembers: 1
    })
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

    // 查当前用户是否已申请（pending/approved）
    const myMember = await TripMember.findOne({
      where: { tripId: trip.id, userId: req.userId }
    })
    const result = trip.toJSON()
    result.myMemberStatus = myMember ? myMember.status : null

    success(res, result)
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
  const t = await sequelize.transaction()
  let committed = false
  try {
    const trip = await Trip.findOne({ where: { id: req.params.id, userId: req.userId }, transaction: t })
    if (!trip) { await t.rollback(); return fail(res, '行程不存在或无权操作', 404) }

    const allowed = ['destination', 'startDate', 'endDate', 'tags', 'description', 'status', 'maxMembers']
    const updates = {}
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f] })

    // 状态机校验：防止状态倒流
    if (updates.status) {
      const validTransitions = { active: ['completed', 'cancelled'], completed: [], cancelled: [] }
      if (!validTransitions[trip.status]?.includes(updates.status)) {
        await t.rollback()
        return fail(res, `行程状态不能从 ${trip.status} 变更为 ${updates.status}`)
      }
    }

    await trip.update(updates, { transaction: t })

    let memberUserIds = []
    let notifyContent = ''

    // 状态变更为 completed/cancelled 时，给所有 approved 成员发通知（排除行程主自己）
    if (updates.status === 'completed' || updates.status === 'cancelled') {
      const contentMap = {
        completed: `【行程完成】你参与的行程「${trip.destination}」已标记完成，快去互相评价一下吧！`,
        cancelled: `【行程取消】很遗憾，你参与的行程「${trip.destination}」已被取消。`
      }
      notifyContent = contentMap[updates.status]

      const approvedMembers = await TripMember.findAll({
        where: { tripId: trip.id, status: 'approved', userId: { [Op.ne]: trip.userId } },
        transaction: t
      })

      memberUserIds = approvedMembers.map(m => m.userId)
      for (const memberId of memberUserIds) {
        const conversationId = [trip.userId, memberId].sort().join('_')
        await Message.create({
          conversationId, senderId: trip.userId, receiverId: memberId,
          content: notifyContent, type: 'system', tripId: trip.id
        }, { transaction: t })
      }
    }

    // 统一在所有 DB 操作完成后提交事务
    await t.commit()
    committed = true

    // WS 推送在事务提交后执行，异常不影响已提交的数据
    if (memberUserIds.length > 0) {
      sendToUsers(memberUserIds, 'trip:notify', {
        tripId: trip.id, status: updates.status,
        destination: trip.destination, message: notifyContent
      })
    }

    success(res, trip, '行程已更新')
  } catch (err) {
    if (!committed) await t.rollback()
    console.error('更新行程失败:', err)
    fail(res, '更新失败', 500)
  }
}

/** 申请加入行程 */
exports.join = async (req, res) => {
  try {
    const trip = await Trip.findByPk(req.params.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'nickname'] }]
    })
    if (!trip) return fail(res, '行程不存在', 404)
    if (trip.userId === req.userId) return fail(res, '不能加入自己的行程')
    if (trip.status !== 'active') return fail(res, '该行程已结束')

    // 满员检查
    if (trip.maxMembers > 0 && trip.currentMembers >= trip.maxMembers) {
      return fail(res, '行程已满员')
    }

    // 防重复申请
    const existing = await TripMember.findOne({
      where: { tripId: trip.id, userId: req.userId }
    })
    if (existing) {
      if (existing.status === 'approved') return fail(res, '您已加入该行程')
      if (existing.status === 'pending') return fail(res, '您已申请该行程，请等待对方确认')
      // rejected / left 状态可重新申请
      await existing.update({ status: 'pending' })
    } else {
      await TripMember.create({ tripId: trip.id, userId: req.userId, status: 'pending' })
    }

    // 获取申请者信息
    const applicant = await User.findByPk(req.userId, { attributes: ['id', 'nickname', 'avatar', 'creditScore'] })

    // 给行程发布者发「申请」类型消息（卡片式）
    const conversationId = [trip.userId, req.userId].sort().join('_')
    await Message.create({
      conversationId,
      senderId: req.userId,
      receiverId: trip.userId,
      content: JSON.stringify({
        applicantNickname: applicant ? applicant.nickname : '旅行者',
        applicantAvatar: applicant ? applicant.avatar : '',
        applicantCreditScore: applicant ? applicant.creditScore : 5.0,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        maxMembers: trip.maxMembers,
        currentMembers: trip.currentMembers,
        tripId: trip.id
      }),
      type: 'apply',
      applyStatus: 'pending',
      tripId: trip.id
    })

    success(res, { joined: true, conversationId }, '申请已发送，等待对方确认')
  } catch (err) { console.error('申请同行失败:', err); fail(res, '申请失败', 500) }
}

/** 查看行程申请列表（仅行程主可查） */
exports.getApplicants = async (req, res) => {
  try {
    const trip = await Trip.findOne({ where: { id: req.params.id, userId: req.userId } })
    if (!trip) return fail(res, '行程不存在或无权查看', 404)

    const applicants = await TripMember.findAll({
      where: { tripId: trip.id, status: 'pending' },
      include: [{ model: User, as: 'user', attributes: ['id', 'nickname', 'avatar', 'creditScore', 'reviewCount'] }],
      order: [['createdAt', 'ASC']]
    })
    success(res, applicants)
  } catch (err) { fail(res, '获取申请列表失败', 500) }
}

/** 同意申请 */
exports.approve = async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const trip = await Trip.findOne({ where: { id: req.params.id, userId: req.userId }, transaction: t, lock: true })
    if (!trip) { await t.rollback(); return fail(res, '行程不存在或无权操作', 403) }

    const applicantUserId = parseInt(req.params.userId)
    const member = await TripMember.findOne({
      where: { tripId: trip.id, userId: applicantUserId, status: 'pending' },
      transaction: t, lock: true
    })
    if (!member) { await t.rollback(); return fail(res, '未找到待审批的申请', 404) }

    // 再次检查满员
    if (trip.maxMembers > 0 && trip.currentMembers >= trip.maxMembers) {
      await t.rollback(); return fail(res, '行程已满员，无法同意更多申请')
    }

    await member.update({ status: 'approved' }, { transaction: t })
    await trip.increment('currentMembers', { by: 1, transaction: t })

    // 更新申请消息的 applyStatus 为 approved
    const conversationId = [trip.userId, applicantUserId].sort().join('_')
    const applyMsg = await Message.findOne({
      where: { conversationId, tripId: trip.id, senderId: applicantUserId, type: 'apply' },
      order: [['createdAt', 'DESC']], transaction: t
    })
    if (applyMsg) await applyMsg.update({ applyStatus: 'approved' }, { transaction: t })

    // 发通知消息给申请者
    await Message.create({
      conversationId,
      senderId: trip.userId,
      receiverId: applicantUserId,
      content: `【申请通过】你已成功加入行程「${trip.destination}」，祝旅途愉快！`,
      type: 'system',
      tripId: trip.id
    }, { transaction: t })

    await t.commit()

    // socket 推送状态变更给申请人（实时刷新卡片）
    sendToUser(applicantUserId, 'apply:update', { tripId: trip.id, applyStatus: 'approved', msgId: applyMsg && applyMsg.id })
    success(res, { approved: true }, '已同意申请')
  } catch (err) {
    await t.rollback()
    console.error('同意申请失败:', err)
    fail(res, '操作失败', 500)
  }
}

/** 拒绝申请 */
exports.reject = async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const trip = await Trip.findOne({ where: { id: req.params.id, userId: req.userId }, transaction: t })
    if (!trip) { await t.rollback(); return fail(res, '行程不存在或无权操作', 403) }

    const applicantUserId = parseInt(req.params.userId)
    const member = await TripMember.findOne({
      where: { tripId: trip.id, userId: applicantUserId, status: 'pending' },
      transaction: t
    })
    if (!member) { await t.rollback(); return fail(res, '未找到待审批的申请', 404) }

    await member.update({ status: 'rejected' }, { transaction: t })

    // 更新申请消息的 applyStatus 为 rejected
    const conversationId = [trip.userId, applicantUserId].sort().join('_')
    const applyMsg = await Message.findOne({
      where: { conversationId, tripId: trip.id, senderId: applicantUserId, type: 'apply' },
      order: [['createdAt', 'DESC']], transaction: t
    })
    if (applyMsg) await applyMsg.update({ applyStatus: 'rejected' }, { transaction: t })

    // 发通知消息给申请者
    await Message.create({
      conversationId,
      senderId: trip.userId,
      receiverId: applicantUserId,
      content: `【申请未通过】很遗憾，你对行程「${trip.destination}」的申请未通过，可以继续寻找合适的搭子～`,
      type: 'system',
      tripId: trip.id
    }, { transaction: t })

    await t.commit()
    // socket 推送状态变更给申请人
    sendToUser(applicantUserId, 'apply:update', { tripId: trip.id, applyStatus: 'rejected', msgId: applyMsg && applyMsg.id })
    success(res, { rejected: true }, '已拒绝申请')
  } catch (err) {
    await t.rollback()
    console.error('拒绝申请失败:', err)
    fail(res, '操作失败', 500)
  }
}

/** 查看已加入的成员列表 */
exports.getMembers = async (req, res) => {
  try {
    const trip = await Trip.findByPk(req.params.id)
    if (!trip) return fail(res, '行程不存在', 404)

    const members = await TripMember.findAll({
      where: { tripId: trip.id, status: 'approved' },
      include: [{ model: User, as: 'user', attributes: ['id', 'nickname', 'avatar', 'creditScore', 'reviewCount'] }],
      order: [['createdAt', 'ASC']]
    })
    success(res, members)
  } catch (err) { fail(res, '获取成员列表失败', 500) }
}

/** 成员主动退出行程 */
exports.leave = async (req, res) => {
  // I2: 预先查用户信息，不占用写事务时间
  const leaver = await User.findByPk(req.userId, { attributes: ['id', 'nickname'] })

  const t = await sequelize.transaction()
  let committed = false
  try {
    const trip = await Trip.findByPk(req.params.id, { transaction: t, lock: true })
    if (!trip) { await t.rollback(); return fail(res, '行程不存在', 404) }
    if (trip.userId === req.userId) { await t.rollback(); return fail(res, '行程发起人不能退出自己的行程') }
    if (trip.status !== 'active') { await t.rollback(); return fail(res, '行程已结束，无法退出') }

    const member = await TripMember.findOne({
      where: { tripId: trip.id, userId: req.userId, status: 'approved' },
      transaction: t, lock: true
    })
    if (!member) { await t.rollback(); return fail(res, '您不在该行程中', 404) }

    // C3：decrement 前保护，防止计数下溢
    if (trip.currentMembers <= 1) { await t.rollback(); return fail(res, '计数异常，请联系管理员', 500) }

    await member.update({ status: 'left' }, { transaction: t })
    await trip.decrement('currentMembers', { by: 1, transaction: t })

    const nickname = leaver ? leaver.nickname : '旅行者'
    const conversationId = [trip.userId, req.userId].sort().join('_')
    await Message.create({
      conversationId, senderId: req.userId, receiverId: trip.userId,
      content: `【成员退出】${nickname} 已退出行程「${trip.destination}」。`,
      type: 'system', tripId: trip.id
    }, { transaction: t })

    await t.commit()
    committed = true

    // WS 实时推送给行程主
    sendToUser(trip.userId, 'trip:notify', {
      tripId: trip.id, event: 'member_left',
      userId: req.userId, nickname,
      destination: trip.destination,
      message: `${nickname} 退出了行程「${trip.destination}」`
    })

    success(res, { left: true }, '已退出行程')
  } catch (err) {
    if (!committed) await t.rollback()
    console.error('退出行程失败:', err)
    fail(res, '退出失败', 500)
  }
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

// controllers/authController.js
const axios = require('axios')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const config = require('../config')
const { success, fail } = require('../utils/helpers')

exports.login = async (req, res) => {
  try {
    const { code, nickName, avatarUrl, gender } = req.body
    if (!code) return fail(res, '缺少登录 code')

    const https = require('https')
    const wxRes = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: { appid: config.wx.appId, secret: config.wx.appSecret, js_code: code, grant_type: 'authorization_code' },
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    })

    const { openid, errcode, errmsg } = wxRes.data
    if (errcode) return fail(res, `微信登录失败: ${errmsg}`)

    let user = await User.findOne({ where: { openid } })
    if (!user) {
      user = await User.create({ openid, nickname: nickName || '旅行者', avatar: avatarUrl || '', gender: gender || 0 })
    } else if (nickName) {
      await user.update({ nickname: nickName, ...(avatarUrl && { avatar: avatarUrl }), ...(gender && { gender }) })
    }

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn })

    success(res, {
      token,
      userInfo: { id: user.id, nickname: user.nickname, avatar: user.avatar, gender: user.gender, creditScore: user.creditScore, bio: user.bio }
    })
  } catch (err) {
    console.error('登录失败:', err)
    fail(res, '登录失败，请稍后重试', 500)
  }
}

exports.check = async (req, res) => {
  success(res, { valid: true })
}

/**
 * 调试用：创建/复用测试账号，直接返回 token
 * POST /auth/dev-login  { nickname: '测试账号A' }
 */
exports.devLogin = async (req, res) => {
  try {
    const nickname = (req.body.nickname || '').trim() || '测试账号'
    // 用固定 openid 前缀区分调试账号，避免污染真实用户
    const openid = `dev_${nickname.replace(/\s+/g, '_')}`

    let user = await User.findOne({ where: { openid } })
    if (!user) {
      user = await User.create({
        openid,
        nickname,
        avatar: '',
        gender: 0
      })
      console.log(`[devLogin] 创建调试账号: ${nickname} (id=${user.id})`)
    } else {
      // 可以更新昵称
      await user.update({ nickname })
      console.log(`[devLogin] 复用调试账号: ${nickname} (id=${user.id})`)
    }

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn })
    success(res, {
      token,
      userInfo: { id: user.id, nickname: user.nickname, avatar: user.avatar, creditScore: user.creditScore, bio: user.bio }
    })
  } catch (err) {
    console.error('devLogin 失败:', err)
    fail(res, '创建调试账号失败', 500)
  }
}

/**
 * 调试用：列出已有测试账号
 * GET /auth/dev-accounts
 */
exports.devAccounts = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { openid: { [require('sequelize').Op.like]: 'dev_%' } },
      attributes: ['id', 'nickname', 'avatar', 'creditScore', 'createdAt'],
      order: [['createdAt', 'ASC']],
      limit: 20
    })
    success(res, { list: users })
  } catch (err) {
    console.error('devAccounts 失败:', err)
    fail(res, '获取调试账号列表失败', 500)
  }
}

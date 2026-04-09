// controllers/authController.js - 登录控制器
const axios = require('axios')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const config = require('../config')
const { success, fail } = require('../utils/helpers')

/**
 * 微信登录
 * POST /api/auth/login
 * body: { code, nickName?, avatarUrl?, gender? }
 */
exports.login = async (req, res) => {
  try {
    const { code, nickName, avatarUrl, gender } = req.body
    if (!code) {
      return fail(res, '缺少登录 code')
    }

    // 调用微信 code2Session 接口
    const wxRes = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: config.wx.appId,
        secret: config.wx.appSecret,
        js_code: code,
        grant_type: 'authorization_code'
      }
    })

    const { openid, session_key, errcode, errmsg } = wxRes.data
    if (errcode) {
      return fail(res, `微信登录失败: ${errmsg}`)
    }

    // 查找或创建用户
    let user = await User.findOne({ openid })
    if (!user) {
      user = await User.create({
        openid,
        nickname: nickName || '旅行者',
        avatar: avatarUrl || '',
        gender: gender || 0
      })
    } else if (nickName) {
      // 更新用户信息
      user.nickname = nickName
      if (avatarUrl) user.avatar = avatarUrl
      if (gender) user.gender = gender
      await user.save()
    }

    // 生成 JWT（注意不要把 session_key 下发）
    const token = jwt.sign(
      { userId: user._id },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    )

    success(res, {
      token,
      userInfo: {
        id: user._id,
        nickname: user.nickname,
        avatar: user.avatar,
        gender: user.gender,
        creditScore: user.creditScore,
        bio: user.bio
      }
    })
  } catch (err) {
    console.error('登录失败:', err)
    fail(res, '登录失败，请稍后重试', 500)
  }
}

/**
 * 检查登录态
 * GET /api/auth/check
 */
exports.check = async (req, res) => {
  success(res, { valid: true })
}

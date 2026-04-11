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

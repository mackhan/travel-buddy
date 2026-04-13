// routes/auth.js - 登录路由
const router = require('express').Router()
const authController = require('../controllers/authController')
const auth = require('../middleware/auth')

router.post('/login', authController.login)
router.get('/check', auth, authController.check)
router.post('/dev-login', authController.devLogin)  // 调试：创建/切换测试账号
router.get('/dev-accounts', authController.devAccounts)  // 调试：列出已有测试账号

module.exports = router

// routes/auth.js - 登录路由
const router = require('express').Router()
const authController = require('../controllers/authController')
const auth = require('../middleware/auth')

router.post('/login', authController.login)
router.get('/check', auth, authController.check)

module.exports = router

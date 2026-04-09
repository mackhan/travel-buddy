// routes/user.js - 用户路由
const router = require('express').Router()
const auth = require('../middleware/auth')
const userController = require('../controllers/userController')

router.get('/me', auth, userController.getProfile)
router.put('/me', auth, userController.updateProfile)
router.get('/:id', auth, userController.getUserById)

module.exports = router

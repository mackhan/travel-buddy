// routes/review.js - 评价路由
const router = require('express').Router()
const auth = require('../middleware/auth')
const reviewController = require('../controllers/reviewController')

router.post('/', auth, reviewController.create)
router.get('/mine', auth, reviewController.getMine)
router.get('/user/:userId', auth, reviewController.getByUser)

module.exports = router

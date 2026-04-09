// routes/expense.js - 费用路由
const router = require('express').Router()
const auth = require('../middleware/auth')
const expenseController = require('../controllers/expenseController')

router.post('/', auth, expenseController.create)
router.get('/', auth, expenseController.getList)
router.get('/:id', auth, expenseController.getById)
router.put('/:id/pay', auth, expenseController.markPaid)

module.exports = router

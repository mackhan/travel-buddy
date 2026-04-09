// routes/trip.js - 行程路由
const router = require('express').Router()
const auth = require('../middleware/auth')
const tripController = require('../controllers/tripController')

router.post('/', auth, tripController.create)
router.get('/search', auth, tripController.search)
router.get('/hot', auth, tripController.getHot)
router.get('/mine', auth, tripController.getMine)
router.get('/:id', auth, tripController.getById)
router.put('/:id', auth, tripController.update)
router.delete('/:id', auth, tripController.remove)

module.exports = router

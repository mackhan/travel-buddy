// routes/trip.js - 行程路由
const router = require('express').Router()
const auth = require('../middleware/auth')
const tripController = require('../controllers/tripController')

router.post('/', auth, tripController.create)
router.get('/search', auth, tripController.search)
router.get('/hot', auth, tripController.getHot)
router.get('/mine', auth, tripController.getMine)
router.get('/applied', auth, tripController.getApplied)
router.post('/:id/join', auth, tripController.join)
router.delete('/:id/leave', auth, tripController.leave)
router.get('/:id/applicants', auth, tripController.getApplicants)
router.post('/:id/approve/:userId', auth, tripController.approve)
router.post('/:id/reject/:userId', auth, tripController.reject)
router.get('/:id/members', auth, tripController.getMembers)
router.get('/:id', auth, tripController.getById)
router.put('/:id', auth, tripController.update)
router.delete('/:id', auth, tripController.remove)

module.exports = router

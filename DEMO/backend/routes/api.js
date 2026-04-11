const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const partnerController = require('../controllers/partnerController');

router.post('/login', userController.login);
router.get('/info/:userId', userController.getUserInfo);
router.put('/profile/:userId', userController.updateProfile);

router.post('/create', partnerController.createPartner);
router.get('/list', partnerController.getPartners);
router.get('/detail/:partnerId', partnerController.getPartnerDetail);
router.put('/status/:partnerId', partnerController.updatePartnerStatus);
router.get('/my/:userId', partnerController.getMyPartners);

module.exports = router;

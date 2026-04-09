// routes/message.js - 消息路由
const router = require('express').Router()
const auth = require('../middleware/auth')
const messageController = require('../controllers/messageController')

router.get('/conversations', auth, messageController.getConversations)
router.get('/unread/count', auth, messageController.getUnreadCount)
router.get('/:conversationId', auth, messageController.getMessages)

module.exports = router

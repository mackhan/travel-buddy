// utils/mock.js - 本地 Mock 数据模块
// 当后端不可用或无 AppID 时，使用模拟数据让小程序完整运行

const MOCK_USER = {
  id: 'mock_user_001',
  _id: 'mock_user_001',
  nickname: '旅行体验官',
  avatar: '',
  gender: 0,
  creditScore: 4.8,
  bio: '热爱旅行，寻找志同道合的旅伴~'
}

const MOCK_TOKEN = 'mock_jwt_token_for_dev'

// 模拟热门行程
const MOCK_TRIPS = [
  {
    _id: 'trip_001',
    title: '清明川西赏花之旅',
    destination: '四川·稻城亚丁',
    description: '一起去看漫山遍野的高山杜鹃，走洛绒牛场到牛奶海经典路线，拼车AA出行~',
    startDate: '2026-04-03',
    endDate: '2026-04-07',
    tags: ['拼车', '拼房'],
    maxMembers: 4,
    currentMembers: 2,
    status: 'active',
    userId: {
      _id: 'user_002',
      nickname: '山野客',
      avatar: '',
      creditScore: 4.6
    },
    createdAt: '2026-03-20T10:00:00Z'
  },
  {
    _id: 'trip_002',
    title: '五一大理慢生活',
    destination: '云南·大理',
    description: '在洱海边骑行、逛古城、喝咖啡，不赶景点，享受慢节奏。拼房可以住更好的海景房~',
    startDate: '2026-05-01',
    endDate: '2026-05-05',
    tags: ['拼房', '拼行程'],
    maxMembers: 3,
    currentMembers: 1,
    status: 'active',
    userId: {
      _id: 'user_003',
      nickname: '云游四方',
      avatar: '',
      creditScore: 4.4
    },
    createdAt: '2026-03-19T15:30:00Z'
  },
  {
    _id: 'trip_003',
    title: '周末西安美食暴走',
    destination: '陕西·西安',
    description: '两天一夜，专攻回民街和各种巷子里的宝藏馆子。一个人吃不了几样，拼饭才是王道！',
    startDate: '2026-03-28',
    endDate: '2026-03-29',
    tags: ['拼饭', '拼行程'],
    maxMembers: 6,
    currentMembers: 3,
    status: 'active',
    userId: {
      _id: 'user_004',
      nickname: '吃遍中国',
      avatar: '',
      creditScore: 4.5
    },
    createdAt: '2026-03-18T08:00:00Z'
  },
  {
    _id: 'trip_004',
    title: '张家界三日徒步',
    destination: '湖南·张家界',
    description: '计划走金鞭溪-袁家界-天子山经典路线，门票可以一起买团体票打折。需要体力还行的伙伴~',
    startDate: '2026-04-10',
    endDate: '2026-04-12',
    tags: ['拼门票', '拼房'],
    maxMembers: 5,
    currentMembers: 2,
    status: 'active',
    userId: {
      _id: 'user_005',
      nickname: '徒步达人',
      avatar: '',
      creditScore: 4.9
    },
    createdAt: '2026-03-21T12:00:00Z'
  },
  {
    _id: 'trip_005',
    title: '端午青海湖环湖自驾',
    destination: '青海·青海湖',
    description: '自驾环湖，经茶卡盐湖、黑马河日出、二郎剑景区。拼车最多4人，油费AA~',
    startDate: '2026-05-28',
    endDate: '2026-06-01',
    tags: ['拼车'],
    maxMembers: 4,
    currentMembers: 1,
    status: 'active',
    userId: {
      _id: 'mock_user_001',
      nickname: '旅行体验官',
      avatar: '',
      creditScore: 4.8
    },
    createdAt: '2026-03-22T09:00:00Z'
  },
  {
    _id: 'trip_006',
    title: '长沙周末吃吃喝喝',
    destination: '湖南·长沙',
    description: '文和友、茶颜悦色、费大厨、超级文和友…一个人排队太无聊了，搭个伴一起~',
    startDate: '2026-04-05',
    endDate: '2026-04-06',
    tags: ['拼饭', '拼行程'],
    maxMembers: 4,
    currentMembers: 2,
    status: 'active',
    userId: {
      _id: 'user_006',
      nickname: '美食猎人',
      avatar: '',
      creditScore: 4.3
    },
    createdAt: '2026-03-20T16:00:00Z'
  }
]

// 模拟聊天消息
const MOCK_MESSAGES = [
  {
    _id: 'msg_001',
    senderId: 'user_002',
    senderName: '山野客',
    content: '你好！看到你也对稻城感兴趣，一起走吧？',
    createdAt: '2026-03-21T10:00:00Z',
    type: 'text'
  },
  {
    _id: 'msg_002',
    senderId: 'mock_user_001',
    senderName: '旅行体验官',
    content: '好呀！我之前去过一次，风景超美。你打算几号出发？',
    createdAt: '2026-03-21T10:05:00Z',
    type: 'text'
  }
]

/**
 * Mock API 路由处理
 * 根据 URL 路径返回模拟数据
 */
function mockRequest(url, method, data) {
  // 去掉 baseUrl 前缀，只保留路径
  const path = url.replace(/^https?:\/\/[^/]+\/api/, '')

  // GET /trips/hot
  if (path.startsWith('/trips/hot') && method === 'GET') {
    return {
      statusCode: 200,
      data: { code: 0, data: MOCK_TRIPS, message: 'ok' }
    }
  }

  // GET /trips/search
  if (path.startsWith('/trips/search') && method === 'GET') {
    let filtered = [...MOCK_TRIPS]
    if (data && data.destination) {
      const dest = data.destination.toLowerCase()
      filtered = filtered.filter(t =>
        t.destination.toLowerCase().includes(dest) ||
        t.title.toLowerCase().includes(dest)
      )
    }
    if (data && data.tags) {
      const tags = data.tags.split(',')
      filtered = filtered.filter(t => tags.some(tag => t.tags.includes(tag)))
    }
    return {
      statusCode: 200,
      data: {
        code: 0,
        data: {
          list: filtered,
          pagination: { page: 1, total: filtered.length, totalPages: 1 }
        },
        message: 'ok'
      }
    }
  }

  // GET /trips/:id
  const tripMatch = path.match(/^\/trips\/([^/?]+)$/)
  if (tripMatch && method === 'GET') {
    const trip = MOCK_TRIPS.find(t => t._id === tripMatch[1])
    return {
      statusCode: trip ? 200 : 404,
      data: trip
        ? { code: 0, data: trip, message: 'ok' }
        : { code: -1, message: '行程不存在' }
    }
  }

  // POST /trips (创建行程)
  if (path === '/trips' && method === 'POST') {
    const newTrip = {
      _id: 'trip_new_' + Date.now(),
      ...data,
      currentMembers: 1,
      status: 'recruiting',
      userId: MOCK_USER,
      createdAt: new Date().toISOString()
    }
    MOCK_TRIPS.unshift(newTrip)
    return {
      statusCode: 200,
      data: { code: 0, data: newTrip, message: '创建成功' }
    }
  }

  // POST /trips/:id/join
  if (path.match(/^\/trips\/[^/]+\/join$/) && method === 'POST') {
    return {
      statusCode: 200,
      data: { code: 0, data: { joined: true }, message: '加入成功' }
    }
  }

  // GET /users/me
  if (path === '/users/me' && method === 'GET') {
    return {
      statusCode: 200,
      data: { code: 0, data: MOCK_USER, message: 'ok' }
    }
  }

  // GET /auth/check
  if (path === '/auth/check' && method === 'GET') {
    return {
      statusCode: 200,
      data: { code: 0, data: { valid: true }, message: 'ok' }
    }
  }

  // GET /messages/conversations
  if (path === '/messages/conversations' && method === 'GET') {
    return {
      statusCode: 200,
      data: {
        code: 0,
        data: [
          {
            conversationId: 'mock_user_001_user_002',
            otherUser: {
              _id: 'user_002',
              nickname: '山野客',
              avatar: ''
            },
            lastMessage: {
              content: '好呀！我之前去过一次，风景超美。你打算几号出发？',
              createdAt: '2026-03-21T10:05:00Z'
            },
            unreadCount: 1
          },
          {
            conversationId: 'mock_user_001_user_004',
            otherUser: {
              _id: 'user_004',
              nickname: '吃遍中国',
              avatar: ''
            },
            lastMessage: {
              content: '西安美食暴走听起来太棒了，我也想去！',
              createdAt: '2026-03-20T18:30:00Z'
            },
            unreadCount: 0
          }
        ],
        message: 'ok'
      }
    }
  }

  // GET /messages
  if (path.startsWith('/messages') && method === 'GET') {
    return {
      statusCode: 200,
      data: {
        code: 0,
        data: { list: MOCK_MESSAGES, pagination: { page: 1, total: 2, totalPages: 1 } },
        message: 'ok'
      }
    }
  }

  // POST /messages (发消息)
  if (path.startsWith('/messages') && method === 'POST') {
    const newMsg = {
      _id: 'msg_' + Date.now(),
      senderId: MOCK_USER.id,
      senderName: MOCK_USER.nickname,
      content: data.content || '',
      createdAt: new Date().toISOString(),
      type: 'text'
    }
    return {
      statusCode: 200,
      data: { code: 0, data: newMsg, message: 'ok' }
    }
  }

  // GET /reviews
  if (path.startsWith('/reviews') && method === 'GET') {
    return {
      statusCode: 200,
      data: {
        code: 0,
        data: { list: [], pagination: { page: 1, total: 0, totalPages: 0 } },
        message: 'ok'
      }
    }
  }

  // GET /expenses
  if (path.startsWith('/expenses') && method === 'GET') {
    return {
      statusCode: 200,
      data: {
        code: 0,
        data: { list: [], pagination: { page: 1, total: 0, totalPages: 0 } },
        message: 'ok'
      }
    }
  }

  // 默认 200 空数据
  return {
    statusCode: 200,
    data: { code: 0, data: null, message: 'mock: 未匹配到路由' }
  }
}

module.exports = {
  MOCK_USER,
  MOCK_TOKEN,
  MOCK_TRIPS,
  mockRequest
}

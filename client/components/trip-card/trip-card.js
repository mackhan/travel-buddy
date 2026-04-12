// components/trip-card/trip-card.js
const { formatDate, timeAgo, getStars } = require('../../utils/util')

Component({
  properties: {
    trip: { type: Object, value: {} }
  },

  data: {
    stars: [],
    creditText: '',
    startDateText: '',
    endDateText: '',
    days: 0,
    timeText: '',
    author: {},
    tagIcons: { '拼车': '🚗', '拼房': '🏨', '拼行程': '🗺️', '拼饭': '🍜', '拼门票': '🎫' }
  },

  observers: {
    'trip': function (trip) {
      if (!trip) return
      // 兼容 MySQL(trip.user) 和 MongoDB(trip.userId)
      const author = trip.user || trip.userId || {}

      const score = author.creditScore || 5
      const starInfo = getStars(score)
      const stars = []
      for (let i = 0; i < starInfo.full; i++) stars.push(true)
      for (let i = 0; i < starInfo.empty + starInfo.half; i++) stars.push(false)

      const startDateText = formatDate(trip.startDate, 'MM-DD')
      const endDateText = formatDate(trip.endDate, 'MM-DD')
      const days = Math.max(1, Math.ceil(
        (new Date(trip.endDate) - new Date(trip.startDate)) / (1000 * 60 * 60 * 24)
      ))

      this.setData({ author, stars, creditText: starInfo.score, startDateText, endDateText, days, timeText: timeAgo(trip.createdAt) })
    }
  },

  methods: {
    onTap() {
      const trip = this.properties.trip
      const id = trip.id || trip._id
      if (id) wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
    }
  }
})

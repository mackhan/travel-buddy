// components/trip-card/trip-card.js
const { formatDate, timeAgo, getStars } = require('../../utils/util')

Component({
  properties: {
    trip: {
      type: Object,
      value: {}
    }
  },

  data: {
    stars: [],
    creditText: '',
    startDateText: '',
    endDateText: '',
    days: 0,
    timeText: '',
    tagIcons: {
      '拼车': '🚗',
      '拼房': '🏨',
      '拼行程': '🗺️',
      '拼饭': '🍜',
      '拼门票': '🎫'
    }
  },

  observers: {
    'trip': function (trip) {
      if (!trip || !trip.userId) return

      // 信誉星级
      const score = trip.userId.creditScore || 5
      const starInfo = getStars(score)
      const stars = []
      for (let i = 0; i < starInfo.full; i++) stars.push(true)
      for (let i = 0; i < starInfo.empty + starInfo.half; i++) stars.push(false)

      // 日期
      const startDateText = formatDate(trip.startDate, 'MM-DD')
      const endDateText = formatDate(trip.endDate, 'MM-DD')
      const days = Math.ceil(
        (new Date(trip.endDate) - new Date(trip.startDate)) / (1000 * 60 * 60 * 24)
      )

      this.setData({
        stars,
        creditText: starInfo.score,
        startDateText,
        endDateText,
        days: Math.max(1, days),
        timeText: timeAgo(trip.createdAt)
      })
    }
  },

  methods: {
    onTap() {
      const id = this.properties.trip._id
      if (id) {
        wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
      }
    }
  }
})

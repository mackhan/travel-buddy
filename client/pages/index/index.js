// pages/index/index.js
const { get } = require('../../utils/request')
const { formatDate, TAG_LIST } = require('../../utils/util')

Page({
  data: {
    destination: '',
    startDate: '',
    endDate: '',
    selectedTags: [],
    tagSelectedMap: {},
    tagLabels: TAG_LIST.map(t => t.label),
    tagIcons: {
      '拼车': '🚗',
      '拼房': '🏨',
      '拼行程': '🗺️',
      '拼饭': '🍜',
      '拼门票': '🎫'
    },
    trips: [],
    allTrips: [],  // 热门行程原始数据，用于前端标签过滤
    loading: false,
    searched: false,
    total: 0,
    page: 1,
    hasMore: false,
    today: '',
    showCityPicker: false
  },

  async onLoad() {
    this.setData({ today: formatDate(new Date(), 'YYYY-MM-DD') })
    // 等待 App 初始化完成（后端检测 + 登录态），再加载数据
    await getApp().ready()
    this.loadHotTrips()
  },

  onShow() {
    // 每次显示刷新
  },

  onPullDownRefresh() {
    if (this.data.searched) {
      this.doSearch()
    } else {
      this.loadHotTrips()
    }
    wx.stopPullDownRefresh()
  },

  // 加载热门行程
  async loadHotTrips() {
    this.setData({ loading: true })
    try {
      const res = await get('/trips/hot', { limit: 20 })
      const allTrips = res.data || []
      this.setData({
        allTrips,
        trips: allTrips,
        loading: false
      })
      // 如果有标签筛选，应用过滤
      this.filterHotTrips()
    } catch (e) {
      this.setData({ loading: false })
    }
  },

  // 热门模式下前端标签过滤
  filterHotTrips() {
    const { allTrips, selectedTags, searched } = this.data
    if (searched) return  // 搜索模式由后端过滤
    if (selectedTags.length === 0) {
      this.setData({ trips: allTrips })
    } else {
      const filtered = allTrips.filter(t =>
        selectedTags.some(tag => t.tags && t.tags.includes(tag))
      )
      this.setData({ trips: filtered })
    }
  },

  // 搜索
  async doSearch() {
    const { destination, startDate, endDate, selectedTags } = this.data
    this.setData({ loading: true, searched: true, page: 1 })

    try {
      const params = { page: 1, limit: 20 }
      if (destination) params.destination = destination
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      if (selectedTags.length > 0) params.tags = selectedTags.join(',')

      const res = await get('/trips/search', params)
      const data = res.data || {}
      this.setData({
        trips: data.list || [],
        total: data.pagination ? data.pagination.total : 0,
        hasMore: data.pagination ? data.pagination.page < data.pagination.totalPages : false,
        loading: false
      })
    } catch (e) {
      this.setData({ loading: false })
    }
  },

  // 加载更多
  async loadMore() {
    if (!this.data.hasMore || this.data.loading) return
    const nextPage = this.data.page + 1
    this.setData({ loading: true })

    try {
      const { destination, startDate, endDate, selectedTags } = this.data
      const params = { page: nextPage, limit: 20 }
      if (destination) params.destination = destination
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      if (selectedTags.length > 0) params.tags = selectedTags.join(',')

      const res = await get('/trips/search', params)
      const data = res.data || {}
      this.setData({
        trips: [...this.data.trips, ...(data.list || [])],
        page: nextPage,
        hasMore: data.pagination ? nextPage < data.pagination.totalPages : false,
        loading: false
      })
    } catch (e) {
      this.setData({ loading: false })
    }
  },

  // 打开城市选择器
  openCityPicker() {
    this.setData({ showCityPicker: true })
  },

  // 关闭城市选择器
  closeCityPicker() {
    this.setData({ showCityPicker: false })
  },

  // 城市选择回调
  onCitySelect(e) {
    this.setData({ destination: e.detail.value })
  },

  clearDest() {
    this.setData({ destination: '' })
  },

  // 日期选择（使用 picker 组件回调）
  onStartDateChange(e) {
    this.setData({ startDate: e.detail.value })
    // 如果结束日期早于开始日期，自动清空
    if (this.data.endDate && this.data.endDate < e.detail.value) {
      this.setData({ endDate: '' })
    }
  },

  onEndDateChange(e) {
    this.setData({ endDate: e.detail.value })
  },

  // 标签筛选
  onFilterAll() {
    this.setData({ selectedTags: [], tagSelectedMap: {} })
    if (this.data.searched) {
      this.doSearch()
    } else {
      this.filterHotTrips()
    }
  },

  onFilterTag(e) {
    const tag = e.currentTarget.dataset.tag
    let { selectedTags, tagSelectedMap } = this.data

    if (tagSelectedMap[tag]) {
      selectedTags = selectedTags.filter(t => t !== tag)
      delete tagSelectedMap[tag]
    } else {
      selectedTags = [...selectedTags, tag]
      tagSelectedMap[tag] = true
    }

    this.setData({ selectedTags, tagSelectedMap })
    if (this.data.searched) {
      this.doSearch()
    } else {
      this.filterHotTrips()
    }
  }
})

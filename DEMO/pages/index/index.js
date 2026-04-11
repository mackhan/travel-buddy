const cityData = require('../../utils/cityData.js')
const api = require('../../utils/api.js')

Page({
  // 页面的数据对象，用于存储页面的状态和数据
  data: {
    // 当前选择的国家，初始为空
    country: '',
    // 当前选择的省份，初始为空
    province: '',
    // 当前选择的城市，初始为空
    city: '',
    // 当前选择的日期，初始为空
    date: '',
    // 开始日期
    startDate: '',
    // 结束日期
    endDate: '',
    // 当前选中的活动类型标签，默认为'all'（全部）
    activeTag: 'all',
    // 搜索关键词，初始为空
    searchKeyword: '',
    // 今天的日期
    today: '',
    // 可选择的最大日期（一年后）
    maxDate: '',
    // 是否显示城市选择弹窗
    showCityPicker: false,
    // 是否显示日期选择弹窗
    showModal: false,
    // 国家列表
    countries: [],
    // 当前国家的省份列表
    provinces: [],
    // 当前省份的城市列表
    cities: [],
    // 选中的国家索引
    countryIndex: 0,
    // 选中的省份索引
    provinceIndex: 0,
    // 选中的城市索引
    cityIndex: 0,
    // 国家搜索关键词
    countrySearchKeyword: '',
    // 省份搜索关键词
    provinceSearchKeyword: '',
    // 城市搜索关键词
    citySearchKeyword: '',
    // 经过筛选后的搭子列表，初始为空
    filteredPartners: [],
    // 加载状态
    loading: false
  },

  // 页面加载时自动执行的生命周期函数
  onLoad() {
    const today = new Date()
    const maxDate = new Date()
    maxDate.setFullYear(maxDate.getFullYear() + 1)

    const countries = cityData.map(item => item.name)

    this.setData({
      today: this.formatDate(today),
      maxDate: this.formatDate(maxDate),
      countries: countries,
      provinces: cityData[0].provinces.map(p => p.name),
      cities: cityData[0].provinces[0].cities,
      country: countries[0],
      province: cityData[0].provinces[0].name,
      city: cityData[0].provinces[0].cities[0],
      countryIndex: 0,
      provinceIndex: 1,  // filteredProvinces[0]="暂不选择", [1]=第一个省
      cityIndex: 1,      // filteredCities[0]="暂不选择", [1]=第一个城
      filteredCountries: countries,
      filteredProvinces: ['暂不选择', ...cityData[0].provinces.map(p => p.name)],
      filteredCities: ['暂不选择', ...cityData[0].provinces[0].cities],
      loading: true
    })

    this.loadPartners()
  },

  async loadPartners() {
    try {
      // 后端请求只传国家维度，本地 filterPartners 负责省/城市维度的细粒度筛选
      const params = { country: this.data.country }

      if (this.data.activeTag !== 'all') {
        params.tag = this.data.activeTag
      }

      const res = await api.getPartners(params)
      this.setData({
        partners: res.data.list,
        filteredPartners: res.data.list,
        loading: false
      })
    } catch (error) {
      console.error('加载搭子失败，使用本地示例数据:', error)
      this.setData({
        partners: this.getMockPartners(),
        filteredPartners: this.getMockPartners(),
        loading: false
      })
    }
  },

  // 本地示例数据（后端不可用时的兜底）
  getMockPartners() {
    return [
      {
        id: 1,
        nickname: '小美',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        city: '上海',
        description: '计划去外滩和豫园逛逛，找个喜欢拍照的搭子一起！带了单反相机可以帮你拍美美的照片。',
        tags: ['photography', 'sightseeing'],
        startDate: '2026-04-05',
        endDate: '2026-04-06',
        time: '上午10:00',
        costType: 'AA',
        price: '',
        status: 'seeking'
      },
      {
        id: 2,
        nickname: '阿杰',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
        city: '上海',
        description: '想去迪士尼玩一天，需要2-3个伙伴一起，AA制。已经买了门票，想找小伙伴一起玩项目、看烟花。',
        tags: ['adventure', 'sightseeing'],
        startDate: '2026-04-10',
        endDate: '2026-04-11',
        time: '全天',
        costType: 'AA',
        price: '',
        status: 'seeking'
      },
      {
        id: 3,
        nickname: '林林',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella',
        city: '北京',
        description: '寻找美食搭子！想打卡北京烤鸭和各种胡同里的宝藏馆子，已经做好攻略了。',
        tags: ['food'],
        startDate: '2026-04-08',
        endDate: '2026-04-09',
        time: '晚上18:00',
        costType: 'AA',
        price: '',
        status: 'seeking'
      },
      {
        id: 4,
        nickname: '大伟',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
        city: '成都',
        description: '三天两夜成都美食之旅，火锅串串不能少！拼车AA出行，已有2人，还差1-2人。',
        tags: ['food', 'carpool'],
        startDate: '2026-04-15',
        endDate: '2026-04-17',
        time: '上午9:00',
        costType: 'AA',
        price: '',
        status: 'seeking'
      },
      {
        id: 5,
        nickname: '小雅',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diana',
        city: '云南·大理',
        description: '五一去大理洱海边骑行、古城闲逛，不赶景点享受慢节奏。拼房可以住更好的海景房。',
        tags: ['sightseeing', 'photography'],
        startDate: '2026-05-01',
        endDate: '2026-05-03',
        time: '全天',
        costType: 'AA',
        price: '',
        status: 'seeking'
      }
    ]
  },

  // 显示城市选择器的方法
  showCityPicker() {
    // 设置显示城市选择弹窗的状态
    this.setData({ showCityPicker: true })
  },

  // 隐藏城市选择器的方法
  hideCityPicker() {
    this.setData({ showCityPicker: false })
  },

  // 确认选择并搜索
  confirmCityPicker() {
    this.setData({ showCityPicker: false }, () => {
      this.filterPartners()
    })
  },

  hideDatePicker() {
    this.setData({ showModal: false }, () => {
      this.filterPartners()
    })
  },

  // 国家搜索输入时的回调函数
  onCountrySearchInput(e) {
    // 获取用户输入的搜索关键词
    const keyword = e.detail.value
    this.setData({ countrySearchKeyword: keyword }, () => {
      this.updateFilteredLists()
    })
  },

  // 省份搜索输入时的回调函数
  onProvinceSearchInput(e) {
    // 获取用户输入的搜索关键词
    const keyword = e.detail.value
    this.setData({ provinceSearchKeyword: keyword }, () => {
      this.updateFilteredLists()
    })
  },

  // 城市搜索输入时的回调函数
  onCitySearchInput(e) {
    // 获取用户输入的搜索关键词
    const keyword = e.detail.value
    this.setData({ citySearchKeyword: keyword }, () => {
      this.updateFilteredLists()
    })
  },

  // 获取筛选后的国家列表
  getFilteredCountries() {
    const keyword = this.data.countrySearchKeyword.toLowerCase()
    if (!keyword) {
      return this.data.countries
    }
    return this.data.countries.filter(country => 
      country.toLowerCase().includes(keyword)
    )
  },

  getFilteredProvinces() {
    const keyword = this.data.provinceSearchKeyword.toLowerCase()
    let provinces = this.data.provinces
    
    if (!keyword) {
      provinces = ['暂不选择', ...provinces]
    } else {
      const filtered = this.data.provinces.filter(province => 
        province.toLowerCase().includes(keyword)
      )
      provinces = ['暂不选择', ...filtered]
    }
    
    return provinces
  },

  getFilteredCities() {
    if (!this.data.province || this.data.cities.length === 0) {
      return []
    }
    
    const keyword = this.data.citySearchKeyword.toLowerCase()
    let cities = this.data.cities
    
    if (!keyword) {
      cities = ['暂不选择', ...cities]
    } else {
      const filtered = this.data.cities.filter(city => 
        city.toLowerCase().includes(keyword)
      )
      cities = ['暂不选择', ...filtered]
    }
    
    return cities
  },

  updateFilteredLists() {
    this.setData({
      filteredCountries: this.getFilteredCountries(),
      filteredProvinces: this.getFilteredProvinces(),
      filteredCities: this.getFilteredCities()
    })
  },

  // 国家选择器值改变时的回调函数
  onCountryChange(e) {
    // data-value 是 filteredCountries 中的索引，需要映射回 countries 中的真实索引
    const filteredIndex = typeof e.detail.value === 'string' ? parseInt(e.currentTarget.dataset.value) : e.detail.value
    const selectedName = this.data.filteredCountries[filteredIndex]
    const countryIndex = this.data.countries.indexOf(selectedName)
    
    if (countryIndex === -1) return
    
    const provinces = cityData[countryIndex].provinces.map(p => p.name)
    const cities = cityData[countryIndex].provinces[0].cities

    this.setData({
      countryIndex,
      provinces,
      cities,
      provinceIndex: 1,  // 默认选中第一个真实省份（filteredProvinces[0]="暂不选择"，filteredProvinces[1]=第一个省）
      cityIndex: 1,      // 默认选中第一个真实城市
      country: selectedName,
      province: provinces[0],
      city: cities[0],
      countrySearchKeyword: '',
      provinceSearchKeyword: '',
      citySearchKeyword: ''
    }, () => {
      this.updateFilteredLists()
    })
  },

  // 省份选择器值改变时的回调函数
  onProvinceChange(e) {
    const provinceIndex = typeof e.detail.value === 'string' ? parseInt(e.currentTarget.dataset.value) : e.detail.value
    
    // provinceIndex 是 filteredProvinces 中的索引，0 = "暂不选择"
    if (provinceIndex === 0) {
      this.setData({
        provinceIndex: 0,
        cityIndex: 0,
        province: '',
        city: '',
        cities: [],
        citySearchKeyword: ''
      }, () => {
        this.updateFilteredLists()
      })
      return
    }
    
    // 真实省份在原始 provinces 数组中的索引 = provinceIndex - 1
    const realIndex = provinceIndex - 1
    const countryData = cityData[this.data.countryIndex]
    
    if (!countryData || !countryData.provinces[realIndex]) {
      console.error('省份数据不存在', { countryIndex: this.data.countryIndex, provinceIndex, realIndex })
      return
    }
    
    const cities = countryData.provinces[realIndex].cities

    this.setData({
      provinceIndex,
      cities,
      cityIndex: 1,  // 默认选中第一个真实城市（filteredCities[0]="暂不选择"，filteredCities[1]=第一个城）
      province: this.data.provinces[realIndex],
      city: cities[0],
      provinceSearchKeyword: '',
      citySearchKeyword: ''
    }, () => {
      this.updateFilteredLists()
    })
  },

  onCityChange(e) {
    const cityIndex = typeof e.detail.value === 'string' ? parseInt(e.currentTarget.dataset.value) : e.detail.value
    
    // cityIndex 是 filteredCities 中的索引，0 = "暂不选择"
    if (cityIndex === 0) {
      this.setData({
        cityIndex: 0,
        city: '',
        citySearchKeyword: ''
      }, () => {
        this.updateFilteredLists()
      })
      return
    }
    
    // 真实城市在原始 cities 数组中的索引 = cityIndex - 1
    const realIndex = cityIndex - 1
    
    if (!this.data.cities[realIndex]) {
      console.error('城市数据不存在', { cityIndex, realIndex, cities: this.data.cities })
      return
    }
    
    this.setData({
      cityIndex,
      city: this.data.cities[realIndex],
      citySearchKeyword: ''
    }, () => {
      this.updateFilteredLists()
    })
  },

  // 显示日期选择器的方法
  showDatePicker() {
    // 设置显示日期选择弹窗的状态
    this.setData({ showModal: true })
  },

  // 日期选择器值改变时的回调函数
  onStartDateChange(e) {
    const startDate = e.detail.value
    const endDate = this.data.endDate

    if (endDate && new Date(startDate) > new Date(endDate)) {
      this.setData({ 
        startDate,
        endDate: ''
      }, () => this.filterPartners())
    } else {
      this.setData({ startDate }, () => this.filterPartners())
    }
  },

  onEndDateChange(e) {
    const endDate = e.detail.value
    const startDate = this.data.startDate

    if (!startDate || new Date(endDate) >= new Date(startDate)) {
      this.setData({ endDate }, () => this.filterPartners())
    }
  },

  // 选择活动类型标签的回调函数
  selectTag(e) {
    // 获取用户点击的标签
    const tag = e.currentTarget.dataset.tag
    // 更新当前选中的标签
    this.setData({ activeTag: tag })
    // 根据标签筛选搭子
    this.filterPartners()
  },

  // 搜索输入框输入时的回调函数
  onSearchInput(e) {
    // 获取用户输入的搜索关键词
    this.setData({ searchKeyword: e.detail.value })
    // 根据关键词筛选搭子
    this.filterPartners()
  },

  // 筛选搭子的核心方法
  filterPartners() {
    let filtered = [...this.data.partners]

    // 目的地筛选：按选中的最细粒度筛选
    if (this.data.city) {
      filtered = filtered.filter(p => p.city.includes(this.data.city))
    } else if (this.data.province) {
      filtered = filtered.filter(p => p.city.includes(this.data.province))
    } else if (this.data.country) {
      filtered = filtered.filter(p => p.city.includes(this.data.country))
    }

    if (this.data.startDate && this.data.endDate) {
      filtered = filtered.filter(p => {
        const partnerStart = new Date(p.startDate)
        const partnerEnd = new Date(p.endDate || p.startDate)
        const filterStart = new Date(this.data.startDate)
        const filterEnd = new Date(this.data.endDate)
        return partnerStart <= filterEnd && partnerEnd >= filterStart
      })
    }

    if (this.data.activeTag !== 'all') {
      filtered = filtered.filter(p => p.tags.includes(this.data.activeTag))
    }

    if (this.data.searchKeyword) {
      const keyword = this.data.searchKeyword.toLowerCase()
      filtered = filtered.filter(p => 
        p.description.toLowerCase().includes(keyword) ||
        p.city.toLowerCase().includes(keyword) ||
        p.tags.some(tag => tag.toLowerCase().includes(keyword))
      )
    }

    this.setData({ filteredPartners: filtered })
  },

  // 跳转到搭子详情页面的方法
  goToDetail(e) {
    // 获取点击的搭子ID
    const id = e.currentTarget.dataset.id
    // 跳转到详情页面，并传递搭子ID
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  // 格式化日期的方法（将日期对象转换为YYYY-MM-DD格式）
  formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
})
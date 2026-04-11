const cityData = require('../../utils/cityData.js')
const api = require('../../utils/api.js')

Page({
  // 页面的数据对象，用于存储表单数据
  data: {
    // 今天的日期
    today: '',
    // 可选择的最大日期（一年后）
    maxDate: '',
    // 是否显示城市选择弹窗
    showCityPicker: false,
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
    // 筛选后的列表
    filteredCountries: [],
    filteredProvinces: [],
    filteredCities: [],
    // 表单数据对象
    formData: {
      country: '', // 国家
      province: '', // 省份
      city: '', // 城市
      date: '', // 出发日期
      time: '', // 出发时间
      tags: [], // 活动类型标签数组
      description: '', // 计划描述
      peopleCount: 1, // 需要的人数，默认1人
      costType: 'AA' // 费用类型，默认AA制
    },
    // 行程列表（支持多条行程）
    trips: []
  },

  // 页面加载时自动执行的生命周期函数
  onLoad() {
    // 获取今天的日期对象
    const today = new Date()
    // 获取最大可选日期对象（一年后）
    const maxDate = new Date()
    // 将最大日期设置为一年后
    maxDate.setFullYear(maxDate.getFullYear() + 1)

    // 初始化国家列表
    const countries = cityData.map(item => item.name)

    // 设置页面数据
    this.setData({
      today: this.formatDate(today),
      maxDate: this.formatDate(maxDate),
      countries: countries,
      provinces: cityData[0].provinces.map(p => p.name),
      cities: cityData[0].provinces[0].cities,
      filteredCountries: countries,
      filteredProvinces: cityData[0].provinces.map(p => p.name),
      filteredCities: cityData[0].provinces[0].cities,
      trips: [{
        country: countries[0],
        province: cityData[0].provinces[0].name,
        city: cityData[0].provinces[0].cities[0],
        startDate: '',
        endDate: '',
        time: '',
        tags: [],
        description: '',
        peopleCount: 1,
        costType: 'AA',
        price: ''
      }]
    })
  },

  // 显示城市选择器的方法
  showCityPicker(e) {
    // 获取行程索引
    const tripIndex = e.currentTarget.dataset.index
    // 设置显示城市选择弹窗的状态
    this.setData({ 
      showCityPicker: true,
      currentTripIndex: tripIndex
    })
  },

  // 隐藏城市选择器的方法
  hideCityPicker() {
    const currentTrip = this.data.trips[this.data.currentTripIndex]
    
    if (!currentTrip.country) {
      wx.showToast({
        title: '请选择国家',
        icon: 'none'
      })
      return
    }
    
    if (!currentTrip.province && !currentTrip.city) {
      wx.showToast({
        title: '请选择省份或城市',
        icon: 'none'
      })
      return
    }
    
    this.setData({ showCityPicker: false })
  },

  hideDatePicker() {
    this.setData({ showDateModal: false })
  },

  onStartDateChange(e) {
    const tripIndex = e.currentTarget.dataset.index
    const trips = [...this.data.trips]
    const startDate = e.detail.value
    const endDate = trips[tripIndex].endDate

    if (endDate && new Date(startDate) > new Date(endDate)) {
      trips[tripIndex].startDate = startDate
      trips[tripIndex].endDate = ''
    } else {
      trips[tripIndex].startDate = startDate
    }
    this.setData({ trips })
  },

  onEndDateChange(e) {
    const tripIndex = e.currentTarget.dataset.index
    const trips = [...this.data.trips]
    const endDate = e.detail.value
    const startDate = trips[tripIndex].startDate

    if (!startDate || new Date(endDate) >= new Date(startDate)) {
      trips[tripIndex].endDate = endDate
      this.setData({ trips })
    }
  },

  // 国家搜索输入时的回调函数
  onCountrySearchInput(e) {
    const keyword = e.detail.value
    this.setData({ countrySearchKeyword: keyword }, () => {
      this.updateFilteredLists()
    })
  },

  onProvinceSearchInput(e) {
    const keyword = e.detail.value
    this.setData({ provinceSearchKeyword: keyword }, () => {
      this.updateFilteredLists()
    })
  },

  onCitySearchInput(e) {
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

  // 获取筛选后的省份列表
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

  onCountryChange(e) {
    // 获取选中的国家索引（可能是picker的值，也可能是点击列表的值）
    const countryIndex = typeof e.detail.value === 'string' ? parseInt(e.currentTarget.dataset.value) : e.detail.value
    // 安全检查：防止索引越界
    if (countryIndex < 0 || countryIndex >= cityData.length || !cityData[countryIndex]) {
      console.warn('无效的国家索引:', countryIndex)
      return
    }
    // 获取该国家的省份列表
    const provinces = cityData[countryIndex].provinces.map(p => p.name)
    // 获取该国家第一个省份的城市列表
    const cities = cityData[countryIndex].provinces[0].cities

    // 更新页面数据
    this.setData({
      countryIndex,
      provinces,
      cities,
      provinceIndex: 0,
      cityIndex: 0,
      countrySearchKeyword: '',
      provinceSearchKeyword: '',
      citySearchKeyword: ''
    })

    // 更新当前行程的城市信息
    this.updateTripCity(cityData[countryIndex].provinces[0].name, cities[0], cityData[countryIndex].name)
  },

  // 省份选择器值改变时的回调函数
  onProvinceChange(e) {
    const provinceIndex = typeof e.detail.value === 'string' ? parseInt(e.currentTarget.dataset.value) : e.detail.value
    
    if (provinceIndex === 0) {
      this.setData({
        provinceIndex: 0,
        cityIndex: 0,
        cities: [],
        provinceSearchKeyword: '',
        citySearchKeyword: ''
      })
      this.updateTripCity('', '', this.data.countries[this.data.countryIndex])
      return
    }
    
    const countryData = cityData[this.data.countryIndex]
    
    if (!countryData || !countryData.provinces[provinceIndex - 1]) {
      console.error('省份数据不存在', { countryIndex: this.data.countryIndex, provinceIndex })
      return
    }
    
    const cities = countryData.provinces[provinceIndex - 1].cities

    this.setData({
      provinceIndex,
      cities,
      cityIndex: 0,
      provinceSearchKeyword: '',
      citySearchKeyword: ''
    })

    this.updateTripCity(this.data.provinces[provinceIndex - 1], cities[0], this.data.countries[this.data.countryIndex])
  },

  onCityChange(e) {
    const cityIndex = typeof e.detail.value === 'string' ? parseInt(e.currentTarget.dataset.value) : e.detail.value
    
    if (cityIndex === 0) {
      this.setData({
        cityIndex: 0,
        citySearchKeyword: ''
      })
      this.updateTripCity(this.data.provinces[this.data.provinceIndex], '', this.data.countries[this.data.countryIndex])
      return
    }
    
    if (!this.data.cities[cityIndex - 1]) {
      console.error('城市数据不存在', { cityIndex, cities: this.data.cities })
      return
    }
    
    this.setData({
      cityIndex,
      citySearchKeyword: ''
    })

    this.updateTripCity(this.data.provinces[this.data.provinceIndex], this.data.cities[cityIndex - 1], this.data.countries[this.data.countryIndex])
  },

  // 更新行程城市信息的方法
  updateTripCity(province, city, country) {
    const trips = [...this.data.trips]
    const currentTripIndex = this.data.currentTripIndex
    if (currentTripIndex !== undefined) {
      trips[currentTripIndex].province = province
      trips[currentTripIndex].city = city
      trips[currentTripIndex].country = country
      this.setData({ trips })
    }
  },

  // 显示日期选择器的方法
  showDatePicker(e) {
    // 获取行程索引
    const tripIndex = e.currentTarget.dataset.index
    // 设置显示日期选择弹窗的状态
    this.setData({ 
      showDateModal: true,
      currentTripIndex: tripIndex
    })
  },

  // 显示时间选择器的方法
  showTimePicker(e) {
    // 获取行程索引
    const tripIndex = e.currentTarget.dataset.index
    // 设置显示时间选择弹窗的状态
    this.setData({ 
      showTimeModal: true,
      currentTripIndex: tripIndex
    })
  },

  // 隐藏日期选择器的方法
  hideDatePicker() {
    this.setData({ showDateModal: false })
  },

  // 隐藏时间选择器的方法
  hideTimePicker() {
    this.setData({ showTimeModal: false })
  },

  // 时间选择器值改变时的回调函数
  onTimeChange(e) {
    // 获取用户选择的时间
    const trips = [...this.data.trips]
    const currentTripIndex = this.data.currentTripIndex
    if (currentTripIndex !== undefined) {
      trips[currentTripIndex].time = e.detail.value
      this.setData({ trips })
    }
  },

  // 切换活动类型标签的方法
  toggleTag(e) {
    // 获取用户点击的标签
    const tag = e.currentTarget.dataset.tag
    // 获取行程索引
    const tripIndex = e.currentTarget.dataset.index
    // 复制一份当前的标签数组
    const trips = [...this.data.trips]
    const tags = [...trips[tripIndex].tags]
    // 查找该标签在数组中的索引
    const index = tags.indexOf(tag)

    // 如果标签已存在，则移除；否则添加
    if (index > -1) {
      tags.splice(index, 1) // 移除标签
    } else {
      tags.push(tag) // 添加标签
    }

    // 更新表单数据中的标签数组
    trips[tripIndex].tags = tags
    this.setData({ trips })
  },

  // 计划描述输入时的回调函数
  onDescriptionInput(e) {
    // 获取用户输入的描述内容
    const trips = [...this.data.trips]
    const tripIndex = e.currentTarget.dataset.index
    trips[tripIndex].description = e.detail.value
    this.setData({ trips })
  },

  // 减少需要人数的方法
  decreaseCount(e) {
    // 获取行程索引
    const tripIndex = e.currentTarget.dataset.index
    // 获取当前人数
    let count = this.data.trips[tripIndex].peopleCount
    // 如果人数大于1，则减1
    if (count > 1) {
      const trips = [...this.data.trips]
      trips[tripIndex].peopleCount = count - 1
      this.setData({ trips })
    }
  },

  // 增加需要人数的方法
  increaseCount(e) {
    // 获取行程索引
    const tripIndex = e.currentTarget.dataset.index
    // 获取当前人数
    let count = this.data.trips[tripIndex].peopleCount
    // 如果人数小于10，则加1
    if (count < 10) {
      const trips = [...this.data.trips]
      trips[tripIndex].peopleCount = count + 1
      this.setData({ trips })
    }
  },

  // 选择费用类型的方法
  selectCostType(e) {
    const type = e.currentTarget.dataset.type
    const tripIndex = e.currentTarget.dataset.index
    const trips = [...this.data.trips]
    trips[tripIndex].costType = type
    this.setData({ trips })
  },

  onPriceInput(e) {
    const price = e.detail.value
    const tripIndex = e.currentTarget.dataset.index
    const trips = [...this.data.trips]
    trips[tripIndex].price = price
    this.setData({ trips })
  },

  // 添加新行程的方法
  addTrip() {
    const trips = [...this.data.trips]
    trips.push({
      country: this.data.countries[0],
      province: this.data.provinces[0],
      city: this.data.cities[0],
      startDate: '',
      endDate: '',
      time: '',
      tags: [],
      description: '',
      peopleCount: 1,
      costType: 'AA',
      price: ''
    })
    this.setData({ trips })
  },

  // 删除行程的方法
  removeTrip(e) {
    // 获取要删除的行程索引
    const tripIndex = e.currentTarget.dataset.index
    const trips = [...this.data.trips]
    // 如果只有一条行程，不允许删除
    if (trips.length <= 1) {
      wx.showToast({
        title: '至少保留一条行程',
        icon: 'none'
      })
      return
    }
    // 删除指定行程
    trips.splice(tripIndex, 1)
    this.setData({ trips })
  },

  // 提交表单的方法
  submitForm() {
    // 验证每条行程
    for (let i = 0; i < this.data.trips.length; i++) {
      const trip = this.data.trips[i]

      // 验证：检查是否选择了城市
      if (!trip.city) {
        wx.showToast({
          title: `第${i + 1}条行程请选择目的地城市`,
          icon: 'none'
        })
        return
      }

      // 验证：检查是否选择了日期
      if (!trip.startDate || !trip.endDate) {
        wx.showToast({
          title: `第${i + 1}条行程请选择出发日期`,
          icon: 'none'
        })
        return
      }

      // 验证：检查是否选择了活动类型
      if (trip.tags.length === 0) {
        wx.showToast({
          title: `第${i + 1}条行程请选择活动类型`,
          icon: 'none'
        })
        return
      }

      if (trip.costType === 'fixed' && !trip.price) {
        wx.showToast({
          title: `第${i + 1}条行程请输入价格`,
          icon: 'none'
        })
        return
      }

      if (!trip.description.trim()) {
        wx.showToast({
          title: `第${i + 1}条行程请填写计划描述`,
          icon: 'none'
        })
        return
      }
    }

    // 显示加载提示
    wx.showLoading({
      title: '发布中...'
    })

    // 模拟网络请求（实际项目中应调用后端API）
    setTimeout(() => {
      // 隐藏加载提示
      wx.hideLoading()
      // 显示成功提示
      wx.showToast({
        title: '发布成功！',
        icon: 'success'
      })

      // 延迟后跳转到首页
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/index/index'
        })
      }, 1500)
    }, 1500)
  },

  // 格式化日期的方法（将日期对象转换为YYYY-MM-DD格式）
  formatDate(date) {
    const year = date.getFullYear() // 获取年份
    const month = String(date.getMonth() + 1).padStart(2, '0') // 获取月份并补零
    const day = String(date.getDate()).padStart(2, '0') // 获取日期并补零
    return `${year}-${month}-${day}` // 返回格式化后的日期字符串
  }
})
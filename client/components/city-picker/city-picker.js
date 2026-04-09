// components/city-picker/city-picker.js
const {
  CHINA_CITIES, INTERNATIONAL_CITIES, HOT_CITIES,
  getProvinces, getCitiesByProvince,
  getCountries, getRegionsByCountry, getCitiesByRegion,
  searchCities
} = require('../../utils/city-data')
const { debounce } = require('../../utils/util')

Component({
  properties: {
    visible: { type: Boolean, value: false },
    value: { type: String, value: '' }
  },

  data: {
    // 搜索
    keyword: '',
    searchResults: [],
    showSearchResults: false,

    // 分类浏览
    tab: 'hot',  // hot | china | international
    // 中国 — 二级：省 → 城市
    provinces: [],
    selectedProvince: '',
    provinceCities: [],
    // 国际 — 三级：国家 → 地区 → 城市
    countries: [],
    selectedCountry: '',
    regions: [],
    selectedRegion: '',
    regionCities: [],

    // 热门
    hotCities: HOT_CITIES
  },

  observers: {
    'visible': function(v) {
      if (v) {
        this.setData({
          provinces: getProvinces(),
          countries: getCountries(),
          keyword: '',
          searchResults: [],
          showSearchResults: false
        })
      }
    }
  },

  lifetimes: {
    attached() {
      this._doSearch = debounce(this._searchImpl.bind(this), 300)
    }
  },

  methods: {
    // ====== 关闭 ======
    onClose() {
      this.triggerEvent('close')
    },

    preventBubble() {
      // 阻止冒泡
    },

    // ====== Tab 切换 ======
    switchTab(e) {
      const tab = e.currentTarget.dataset.tab
      this.setData({
        tab,
        showSearchResults: false,
        keyword: ''
      })
    },

    // ====== 搜索 ======
    onSearchInput(e) {
      const keyword = e.detail.value
      this.setData({ keyword })
      if (keyword.trim()) {
        this._doSearch(keyword.trim())
      } else {
        this.setData({ showSearchResults: false, searchResults: [] })
      }
    },

    clearSearch() {
      this.setData({ keyword: '', showSearchResults: false, searchResults: [] })
    },

    _searchImpl(keyword) {
      const results = searchCities(keyword)
      this.setData({ searchResults: results, showSearchResults: true })
    },

    onSearchSelect(e) {
      const value = e.currentTarget.dataset.value
      this._select(value)
    },

    // ====== 热门城市 ======
    onHotSelect(e) {
      const value = e.currentTarget.dataset.value
      this._select(value)
    },

    // ====== 中国 — 选省 ======
    onProvinceSelect(e) {
      const province = e.currentTarget.dataset.province
      const cities = getCitiesByProvince(province)
      // 如果该省只有一个同名城市（直辖市），直接选中
      if (cities.length === 1 && cities[0] === province) {
        this._select(province + '·' + cities[0])
        return
      }
      this.setData({
        selectedProvince: province,
        provinceCities: cities
      })
    },

    onChinaCitySelect(e) {
      const city = e.currentTarget.dataset.city
      const value = this.data.selectedProvince + '·' + city
      this._select(value)
    },

    backToProvinces() {
      this.setData({ selectedProvince: '', provinceCities: [] })
    },

    // ====== 国际 — 选国家 ======
    onCountrySelect(e) {
      const country = e.currentTarget.dataset.country
      const regions = getRegionsByCountry(country)
      // 如果只有一个同名地区，直接展开城市
      if (regions.length === 1 && regions[0] === country) {
        const cities = getCitiesByRegion(country, regions[0])
        if (cities.length === 1) {
          this._select(country + '·' + cities[0])
          return
        }
        this.setData({
          selectedCountry: country,
          regions: regions,
          selectedRegion: regions[0],
          regionCities: cities
        })
        return
      }
      this.setData({
        selectedCountry: country,
        regions: regions,
        selectedRegion: '',
        regionCities: []
      })
    },

    onRegionSelect(e) {
      const region = e.currentTarget.dataset.region
      const cities = getCitiesByRegion(this.data.selectedCountry, region)
      this.setData({
        selectedRegion: region,
        regionCities: cities
      })
    },

    onIntlCitySelect(e) {
      const city = e.currentTarget.dataset.city
      const value = this.data.selectedCountry + '·' + city
      this._select(value)
    },

    backToCountries() {
      this.setData({ selectedCountry: '', regions: [], selectedRegion: '', regionCities: [] })
    },

    backToRegions() {
      this.setData({ selectedRegion: '', regionCities: [] })
    },

    // ====== 通用选择 ======
    _select(value) {
      this.triggerEvent('select', { value })
      this.triggerEvent('close')
      // 重置状态
      this.setData({
        keyword: '',
        showSearchResults: false,
        selectedProvince: '',
        provinceCities: [],
        selectedCountry: '',
        regions: [],
        selectedRegion: '',
        regionCities: []
      })
    }
  }
})

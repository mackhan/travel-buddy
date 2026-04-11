# 搭牛牛微信小程序 - 完整项目总结

## 项目概述
- **项目名称**：搭牛牛
- **项目类型**：非盈利微信小程序
- **核心功能**：帮助世界各地旅行的人找搭子
- **设计风格**：年轻化，参考"粗门"小程序
- **主要特色**：支持全球国家/省份/城市选择，支持多条行程发布

## 技术栈
- **开发框架**：微信小程序原生框架
- **编程语言**：JavaScript、WXML、WXSS
- **数据存储**：Mock数据（模拟数据）
- **第三方服务**：DiceBear（头像生成）

## 项目结构

```
DEMO/
├── app.js                          # 小程序入口文件
├── app.json                        # 小程序配置文件
├── app.wxss                        # 全局样式文件
├── project.config.json              # 项目配置文件
├── project.private.config.json      # 项目私有配置文件
├── sitemap.json                    # 站点地图配置
├── utils/                         # 工具函数目录
│   └── cityData.js               # 城市数据文件
└── pages/                         # 页面目录
    ├── index/                     # 首页（筛选搭子）
    │   ├── index.js
    │   ├── index.json
    │   ├── index.wxml
    │   └── index.wxss
    ├── publish/                   # 发搭子页面
    │   ├── publish.js
    │   ├── publish.json
    │   ├── publish.wxml
    │   └── publish.wxss
    ├── detail/                    # 详情页面
    │   ├── detail.js
    │   ├── detail.json
    │   ├── detail.wxml
    │   └── detail.wxss
    └── my/                       # 我的页面
        ├── my.js
        ├── my.json
        ├── my.wxml
        └── my.wxss
```

## 核心功能

### 1. 首页（筛选搭子）
- 显示所有搭子列表
- 支持按城市、日期、标签筛选
- 国家-省份-城市三级选择（支持搜索）
- 点击查看详情

### 2. 发搭子页面
- 支持发布多条行程
- 国家-省份-城市三级选择（支持搜索）
- 选择出发日期和时间
- 选择活动类型标签（拼车、拼房、美食、景点、其他）
- 填写计划描述
- 选择需要的人数
- 选择费用类型（AA制、我请客、AA+我包车）

### 3. 详情页面
- 显示搭子详细信息
- 显示发布者信息
- 显示行程列表
- 支持邀请搭子

### 4. 我的页面
- 显示用户信息
- 显示发布的搭子
- 显示收到的邀请
- 关于我们
- 版本信息

## 关键配置文件

### app.json（小程序配置）
```json
{
  "pages": [
    "pages/index/index",
    "pages/publish/publish",
    "pages/detail/detail",
    "pages/my/my"
  ],
  "window": {
    "backgroundTextStyle": "light",
    "navigationBarBackgroundColor": "#FF6B9D",
    "navigationBarTitleText": "搭牛牛",
    "navigationBarTextStyle": "white",
    "backgroundColor": "#F5F5F5"
  },
  "tabBar": {
    "color": "#999999",
    "selectedColor": "#FF6B9D",
    "backgroundColor": "#FFFFFF",
    "borderStyle": "white",
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "找搭子"
      },
      {
        "pagePath": "pages/publish/publish",
        "text": "发搭子"
      },
      {
        "pagePath": "pages/my/my",
        "text": "我的"
      }
    ]
  },
  "style": "v2",
  "sitemapLocation": "sitemap.json"
}
```

### project.config.json（项目配置）
```json
{
  "description": "搭牛牛 - 帮助世界各地旅行的人找搭子",
  "packOptions": {
    "ignore": []
  },
  "setting": {
    "bundle": false,
    "userConfirmedBundleSwitch": false,
    "urlCheck": false,
    "scopeDataCheck": false,
    "coverView": true,
    "es6": true,
    "postcss": true,
    "compileHotReLoad": true,
    "lazyloadPlaceholderEnable": false,
    "preloadBackgroundData": false,
    "minified": true,
    "autoAudits": false,
    "newFeature": false,
    "uglifyFileName": false,
    "uploadWithSourceMap": true,
    "useIsolateContext": true,
    "nodeModules": false,
    "enhance": true,
    "useMultiFrameRuntime": true,
    "useApiHook": true,
    "useApiHostProcess": true,
    "showShadowRootInWxmlPanel": true,
    "packNpmManually": false,
    "enableEngineNative": false,
    "packNpmRelationList": [],
    "minifyWXSS": true,
    "showES6CompileOption": false,
    "minifyWXML": true,
    "babelSetting": {
      "ignore": [],
      "disablePlugins": [],
      "outputPath": ""
    }
  },
  "compileType": "miniprogram",
  "libVersion": "3.14.3",
  "appid": "wx43f7065543a08d27",
  "projectname": "搭牛牛",
  "condition": {},
  "editorSetting": {
    "tabIndent": "insertSpaces",
    "tabSize": 2
  },
  "simulatorPluginLibVersion": {}
}
```

## 核心代码文件

### app.js（小程序入口）
```javascript
App({
  globalData: {
    userInfo: null,
    partners: [],
    myPartners: []
  },

  onLaunch() {
    this.loadMockData()
  },

  loadMockData() {
    const partners = [
      {
        id: 1,
        nickname: '旅行达人小王',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        country: '中国',
        province: '北京',
        city: '朝阳区',
        date: '2026-03-25',
        time: '09:00',
        tags: ['美食', '景点'],
        description: '计划去故宫和颐和园，想找个搭子一起逛，中午可以一起吃北京烤鸭',
        peopleCount: 2,
        costType: 'AA',
        trips: [
          {
            country: '中国',
            province: '北京',
            city: '朝阳区',
            date: '2026-03-25',
            time: '09:00',
            tags: ['美食', '景点']
          }
        ]
      },
      {
        id: 2,
        nickname: '背包客小李',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
        country: '中国',
        province: '上海',
        city: '浦东新区',
        date: '2026-03-26',
        time: '14:00',
        tags: ['拼车', '景点'],
        description: '想去迪士尼，拼车前往，费用AA',
        peopleCount: 3,
        costType: 'AA',
        trips: [
          {
            country: '中国',
            province: '上海',
            city: '浦东新区',
            date: '2026-03-26',
            time: '14:00',
            tags: ['拼车', '景点']
          }
        ]
      }
    ]
    this.globalData.partners = partners
  }
})
```

### app.wxss（全局样式）
```css
page {
  background-color: #F5F5F5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
}

.container {
  min-height: 100vh;
  padding-bottom: 120rpx;
}

.btn-primary {
  background: linear-gradient(135deg, #FF6B9D 0%, #FF8E53 100%);
  color: #FFFFFF;
  border-radius: 50rpx;
  padding: 28rpx;
  font-size: 32rpx;
  font-weight: 600;
  box-shadow: 0 8rpx 24rpx rgba(255, 107, 157, 0.4);
}

.btn-primary::after {
  border: none;
}
```

### utils/cityData.js（城市数据）
包含60多个国家和地区的数据，每个国家包含省份和城市信息。数据结构如下：

```javascript
const cityData = [
  {
    name: '阿富汗',
    code: 'AF',
    provinces: [
      { name: '喀布尔', code: 'KBL', cities: ['喀布尔'] },
      { name: '坎大哈', code: 'KDH', cities: ['坎大哈'] }
    ]
  },
  {
    name: '中国',
    code: 'CN',
    provinces: [
      {
        name: '北京',
        code: '110000',
        cities: ['东城区', '西城区', '朝阳区', '丰台区', '石景山区', '海淀区', '门头沟区', '房山区', '通州区', '顺义区', '昌平区', '大兴区', '怀柔区', '平谷区', '密云区', '延庆区']
      },
      {
        name: '上海',
        code: '310000',
        cities: ['黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '杨浦区', '闵行区', '宝山区', '嘉定区', '浦东新区', '金山区', '松江区', '青浦区', '奉贤区', '崇明区']
      }
    ]
  }
]

module.exports = cityData
```

## 页面代码示例

### pages/index/index.js（首页逻辑）
```javascript
const cityData = require('../../utils/cityData.js')

Page({
  data: {
    showCityPicker: false,
    countries: [],
    provinces: [],
    cities: [],
    countryIndex: 0,
    provinceIndex: 0,
    cityIndex: 0,
    countrySearchKeyword: '',
    provinceSearchKeyword: '',
    citySearchKeyword: '',
    country: '中国',
    province: '北京',
    city: '朝阳区',
    selectedDate: '',
    selectedTag: '',
    tags: ['拼车', '拼房', '美食', '景点', '其他'],
    filteredPartners: []
  },

  onLoad() {
    const app = getApp()
    const countries = cityData.map(item => item.name)
    const provinces = cityData[0].provinces.map(p => p.name)
    const cities = cityData[0].provinces[0].cities

    this.setData({
      countries,
      provinces,
      cities,
      filteredPartners: app.globalData.partners
    })
  },

  showCityPicker() {
    this.setData({ showCityPicker: true })
  },

  hideCityPicker() {
    this.setData({ showCityPicker: false })
  },

  onCountrySearchInput(e) {
    const keyword = e.detail.value
    this.setData({ countrySearchKeyword: keyword })
  },

  getFilteredCountries() {
    const keyword = this.data.countrySearchKeyword.toLowerCase()
    if (!keyword) {
      return this.data.countries
    }
    return this.data.countries.filter(country => 
      country.toLowerCase().includes(keyword)
    )
  },

  onCountryChange(e) {
    const countryIndex = typeof e.detail.value === 'string' ? parseInt(e.currentTarget.dataset.value) : e.detail.value
    const provinces = cityData[countryIndex].provinces.map(p => p.name)
    const cities = cityData[countryIndex].provinces[0].cities

    this.setData({
      countryIndex,
      provinces,
      cities,
      provinceIndex: 0,
      cityIndex: 0,
      country: this.data.countries[countryIndex],
      province: provinces[0],
      city: cities[0],
      countrySearchKeyword: '',
      provinceSearchKeyword: '',
      citySearchKeyword: ''
    })

    this.filterPartners()
  },

  filterPartners() {
    const app = getApp()
    let partners = app.globalData.partners

    if (this.data.city) {
      partners = partners.filter(p => p.city === this.data.city)
    }

    if (this.data.selectedDate) {
      partners = partners.filter(p => p.date === this.data.selectedDate)
    }

    if (this.data.selectedTag) {
      partners = partners.filter(p => p.tags.includes(this.data.selectedTag))
    }

    this.setData({ filteredPartners: partners })
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  }
})
```

### pages/publish/publish.js（发搭子页面逻辑）
```javascript
const cityData = require('../../utils/cityData.js')

Page({
  data: {
    today: '',
    maxDate: '',
    showCityPicker: false,
    countries: [],
    provinces: [],
    cities: [],
    countryIndex: 0,
    provinceIndex: 0,
    cityIndex: 0,
    countrySearchKeyword: '',
    provinceSearchKeyword: '',
    citySearchKeyword: '',
    formData: {
      country: '',
      province: '',
      city: '',
      date: '',
      time: '',
      tags: [],
      description: '',
      peopleCount: 1,
      costType: 'AA'
    },
    trips: [],
    tags: ['拼车', '拼房', '美食', '景点', '其他']
  },

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
      trips: [{
        country: countries[0],
        province: cityData[0].provinces[0].name,
        city: cityData[0].provinces[0].cities[0],
        date: '',
        time: '',
        tags: [],
        description: '',
        peopleCount: 1,
        costType: 'AA'
      }]
    })
  },

  formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  showCityPicker(e) {
    const tripIndex = e.currentTarget.dataset.index
    this.setData({ 
      showCityPicker: true,
      currentTripIndex: tripIndex
    })
  },

  hideCityPicker() {
    this.setData({ showCityPicker: false })
  },

  addTrip() {
    const newTrip = {
      country: this.data.countries[0],
      province: this.data.provinces[0],
      city: this.data.cities[0],
      date: '',
      time: '',
      tags: [],
      description: '',
      peopleCount: 1,
      costType: 'AA'
    }
    this.setData({
      trips: [...this.data.trips, newTrip]
    })
  },

  removeTrip(e) {
    const index = e.currentTarget.dataset.index
    const trips = this.data.trips.filter((_, i) => i !== index)
    this.setData({ trips })
  },

  submitForm() {
    const app = getApp()
    const newPartner = {
      id: Date.now(),
      nickname: '旅行者',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + Date.now(),
      country: this.data.trips[0].country,
      province: this.data.trips[0].province,
      city: this.data.trips[0].city,
      date: this.data.trips[0].date,
      time: this.data.trips[0].time,
      tags: this.data.trips[0].tags,
      description: this.data.trips[0].description,
      peopleCount: this.data.trips[0].peopleCount,
      costType: this.data.trips[0].costType,
      trips: this.data.trips
    }

    app.globalData.partners.unshift(newPartner)
    app.globalData.myPartners.unshift(newPartner)

    wx.showToast({
      title: '发布成功',
      icon: 'success'
    })

    setTimeout(() => {
      wx.switchTab({
        url: '/pages/index/index'
      })
    }, 1500)
  }
})
```

## 样式设计

### 主题色
- **主色调**：#FF6B9D（粉色）
- **辅助色**：#FF8E53（橙色）
- **背景色**：#F5F5F5（浅灰）
- **文字色**：#333333（深灰）

### 设计特点
- 年轻化、活泼的风格
- 渐变色按钮和标题
- 圆角卡片设计
- 阴影效果增强层次感

## 数据结构

### 搭子数据结构
```javascript
{
  id: 1,
  nickname: '旅行达人小王',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  country: '中国',
  province: '北京',
  city: '朝阳区',
  date: '2026-03-25',
  time: '09:00',
  tags: ['美食', '景点'],
  description: '计划去故宫和颐和园...',
  peopleCount: 2,
  costType: 'AA',
  trips: [
    {
      country: '中国',
      province: '北京',
      city: '朝阳区',
      date: '2026-03-25',
      time: '09:00',
      tags: ['美食', '景点']
    }
  ]
}
```

## 功能特性

### 1. 国家-省份-城市三级选择
- 支持60多个国家和地区
- 支持搜索功能（实时筛选）
- 字母顺序排列
- 级联选择（选择国家后显示对应省份，选择省份后显示对应城市）

### 2. 多条行程发布
- 支持添加多条行程
- 每条行程可以有不同的目的地、日期、时间
- 可以删除已添加的行程

### 3. 标签系统
- 预设标签：拼车、拼房、美食、景点、其他
- 支持多选
- 标签筛选功能

### 4. 费用类型
- AA制
- 我请客
- AA+我包车

## 开发步骤

### 第一步：创建项目
1. 打开微信开发者工具
2. 选择"小程序项目"
3. 填写项目信息：
   - 项目名称：搭牛牛
   - 目录：选择项目目录
   - AppID：使用测试号或自己的AppID
4. 点击"创建"

### 第二步：配置文件
1. 创建 app.json 配置文件
2. 创建 project.config.json 配置文件
3. 创建 sitemap.json 配置文件

### 第三步：创建页面
1. 创建 pages/index 目录（首页）
2. 创建 pages/publish 目录（发搭子页面）
3. 创建 pages/detail 目录（详情页面）
4. 创建 pages/my 目录（我的页面）

### 第四步：实现功能
1. 实现首页筛选功能
2. 实现发搭子功能
3. 实现详情页面功能
4. 实现我的页面功能

### 第五步：添加样式
1. 创建全局样式 app.wxss
2. 创建各页面样式文件
3. 调整布局和视觉效果

### 第六步：测试
1. 测试所有功能
2. 修复bug
3. 优化用户体验

## 注意事项

1. **数据存储**：当前使用Mock数据，实际项目需要接入后端API
2. **用户认证**：需要实现微信登录功能
3. **数据同步**：需要实现数据同步和更新机制
4. **图片上传**：需要实现图片上传功能
5. **消息通知**：需要实现消息推送功能
6. **安全性**：需要注意用户数据安全和隐私保护

## 第三方服务

### DiceBear（头像生成）
- API地址：https://api.dicebear.com/7.x/avataaars/svg?seed={随机字符串}
- 用途：生成随机头像

## 扩展建议

1. **添加聊天功能**：让搭子之间可以直接聊天
2. **添加评价系统**：对搭子进行评价
3. **添加地图功能**：显示搭子位置
4. **添加推荐算法**：根据用户偏好推荐搭子
5. **添加活动功能**：组织线下活动

## 总结

这个"搭牛牛"小程序是一个完整的旅行搭子匹配平台，具有以下特点：

1. **功能完整**：包含筛选、发布、详情、个人中心等核心功能
2. **用户体验好**：支持搜索、多选、多条行程等便捷功能
3. **设计美观**：年轻化的设计风格，视觉效果好
4. **易于扩展**：代码结构清晰，方便后续功能扩展

通过本文档，您可以快速了解项目的整体架构和实现细节，方便后续维护和重新开发。

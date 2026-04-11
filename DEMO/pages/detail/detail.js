Page({
  // 页面的数据对象
  data: {
    partnerId: null, // 搭子ID
    partner: {}, // 搭子详细信息
    message: '' // 用户输入的留言内容
  },

  // 页面加载时自动执行的生命周期函数
  onLoad(options) {
    // 从页面参数中获取搭子ID
    const id = options.id
    // 保存搭子ID到页面数据
    this.setData({ partnerId: id })
    // 加载搭子详细信息
    this.loadPartnerDetail(id)
  },

  // 加载搭子详细信息的方法
  loadPartnerDetail(id) {
    // 模拟的搭子数据列表（实际项目中应从后端API获取）
    const partners = [
      {
        id: 1,
        name: '小美',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        city: '上海',
        description: '计划去外滩和豫园逛逛，找个喜欢拍照的搭子一起！我带了单反相机，可以帮你拍美美的照片。我们还可以一起去吃小笼包和生煎包，体验地道的上海美食。',
        tags: ['摄影', '观光'],
        startDate: '2026-04-05',
        endDate: '2026-04-06',
        time: '上午10:00',
        peopleCount: 2,
        costType: 'AA',
        costTypeText: 'AA制',
        status: 'seeking',
        statusText: '寻找中'
      },
      {
        id: 2,
        name: '阿杰',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
        city: '上海',
        description: '想去迪士尼玩一天，需要2-3个伙伴一起，AA制。我已经买了门票，想找几个小伙伴一起玩项目、拍照、看烟花。最好能早起，我想玩遍所有热门项目！',
        tags: ['探险', '观光'],
        startDate: '2026-04-10',
        endDate: '2026-04-11',
        time: '全天',
        peopleCount: 3,
        costType: 'AA',
        costTypeText: 'AA制',
        status: 'seeking',
        statusText: '寻找中'
      },
      {
        id: 3,
        name: '林林',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella',
        city: '上海',
        description: '寻找美食搭子！想打卡上海本帮菜和网红餐厅。我是个吃货，已经做好攻略了，包括老字号本帮菜、网红甜品店、特色小吃等。AA制，预算人均200左右。',
        tags: ['美食'],
        startDate: '2026-04-08',
        endDate: '2026-04-09',
        time: '晚上18:00',
        peopleCount: 2,
        costType: 'AA',
        costTypeText: 'AA制',
        status: 'seeking',
        statusText: '寻找中'
      },
      {
        id: 4,
        name: '大伟',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
        city: '北京',
        description: '故宫深度游，找个对历史感兴趣的搭子。我是个历史爱好者，已经做了很多功课，可以给你讲解很多有趣的历史故事。我们还可以去景山公园看故宫全景。',
        tags: ['观光', '摄影'],
        startDate: '2026-04-20',
        endDate: '2026-04-21',
        time: '上午9:00',
        peopleCount: 2,
        costType: 'AA',
        costTypeText: 'AA制',
        status: 'seeking',
        statusText: '寻找中'
      },
      {
        id: 5,
        name: '小雅',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diana',
        city: '北京',
        description: '三里屯购物，想找个时尚搭子一起买买买。我知道很多潮牌店和设计师品牌，还可以一起去网红咖啡店打卡。预算不限，主要是想找个有共同爱好的朋友。',
        tags: ['购物'],
        startDate: '2026-04-18',
        endDate: '2026-04-18',
        time: '下午14:00',
        peopleCount: 2,
        costType: 'negotiate',
        costTypeText: '面议',
        status: 'seeking',
        statusText: '寻找中'
      }
    ]

    // 根据ID查找对应的搭子信息
    const partner = partners.find(p => p.id === parseInt(id))
    // 如果找到搭子，则更新页面数据
    if (partner) {
      this.setData({ partner })
    }
  },

  // 留言输入框输入时的回调函数
  onMessageInput(e) {
    // 获取用户输入的留言内容
    this.setData({
      message: e.detail.value
    })
  },

  // 发起邀请的方法
  sendRequest() {
    // 验证：检查是否填写了留言
    if (!this.data.message.trim()) {
      wx.showToast({
        title: '请填写留言',
        icon: 'none'
      })
      return
    }

    // 显示确认对话框
    wx.showModal({
      title: '确认发起邀请',
      content: '确定要向对方发起邀请吗？',
      // 用户点击确定后的回调
      success: (res) => {
        if (res.confirm) {
          // 显示加载提示
          wx.showLoading({
            title: '发送中...'
          })

          // 模拟网络请求（实际项目中应调用后端API）
          setTimeout(() => {
            // 隐藏加载提示
            wx.hideLoading()
            // 显示成功提示
            wx.showToast({
              title: '邀请已发送！',
              icon: 'success'
            })

            // 延迟后返回上一页
            setTimeout(() => {
              wx.navigateBack()
            }, 1500)
          }, 1500)
        }
      }
    })
  },

  // 分享搭子信息的方法
  sharePartner() {
    // 获取当前搭子信息
    const { partner } = this.data
    // 显示分享菜单
    wx.showShareMenu({
      withShareTicket: true, // 使用带 shareTicket 的转发
      menus: ['shareAppMessage', 'shareTimeline'] // 支持分享给好友和分享到朋友圈
    })
  },

  // 自定义分享内容的方法（微信小程序会自动调用）
  onShareAppMessage() {
    // 获取当前搭子信息
    const { partner } = this.data
    // 返回分享配置
    return {
      title: `${partner.name}在${partner.city}找搭子，一起出发吧！`, // 分享标题
      path: `/pages/detail/detail?id=${partner.id}`, // 分享路径
      imageUrl: partner.avatar // 分享图片
    }
  }
})
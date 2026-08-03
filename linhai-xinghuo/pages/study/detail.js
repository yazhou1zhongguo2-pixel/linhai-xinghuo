// 研学详情页 —— 产品完整信息 + 报名入口
// 设计书：行程安排、课程大纲、师资介绍、往期评价、适龄建议

const api = require('../../utils/api.js')

Page({
  data: {
    product: null      // 当前产品详情
  },

  onLoad(options) {
    // options.id 是列表页跳转时 ?id= 传过来的产品编号
    api.getStudyDetail(options.id).then(product => {
      // 预处理：每个日期算出剩余名额，供界面展示（满员显示"已满"）
      const dates = (product.dates || []).map(d => ({
        ...d,
        remaining: product.capacity - d.booked,
        full: d.booked >= product.capacity
      }))
      this.setData({ product: { ...product, dates } })
    })
  },

  // 底部"立即预约"按钮 → 报名页
  goBook() {
    if (!this.data.product) return
    wx.navigateTo({ url: '/pages/study/book?id=' + this.data.product.id })
  },

  // 集合点定位（wx.openLocation 内置地图）
  openMeet() {
    const m = this.data.product.meet
    if (!m) return
    wx.openLocation({
      latitude: m.latitude,
      longitude: m.longitude,
      name: m.name,
      scale: 15
    })
  }
})
